import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { docData, queryData } from './_lib/firestoreUtil'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'
import { formatBookingCreatedMessage, formatReferralRewardMessage, notifyTelegram } from './_lib/telegram'
import { REFERRAL_REWARD_UZS } from './_lib/referral'
import { calculatePrice, FIRST_BOOKING_DISCOUNT, REFERRAL_REFERRED_DISCOUNT } from '../../src/lib/pricing'
import type { Addon, Booking, BookingFrequency, BookingTier, Cleaner, ServiceType } from '../../src/lib/types'

const VALID_TIERS: BookingTier[] = ['standard', 'premium', 'elite']
const MAX_REPAIR_PHOTOS = 2
const MAX_REPAIR_PHOTO_LENGTH = 350_000 // each photo is a compressed data: URL - see src/lib/projectPhoto.ts
const MAX_REPAIR_NOTES_LENGTH = 2000

interface CreateBookingBody {
  serviceId: string
  rooms: number
  areaSqm: number | null
  floor: number | null
  address: string
  city: string
  date: string
  time: string
  frequency: BookingFrequency
  tier?: BookingTier
  addonCodes: string[]
  contactName: string
  contactPhone: string
  notes: string
  repairPhotos?: string[]
  repairNotes?: string
}

/** Firestore has no joins - manually attach service_types/cleaners/payments,
 * matching the shape the frontend expects (see src/lib/types.ts Booking). */
async function enrichBooking(
  db: FirebaseFirestore.Firestore,
  id: string,
  data: FirebaseFirestore.DocumentData,
): Promise<Booking> {
  const [serviceSnap, cleanerSnap, paymentsSnap] = await Promise.all([
    data.service_type_id ? db.collection('serviceTypes').doc(data.service_type_id).get() : Promise.resolve(null),
    data.cleaner_id ? db.collection('cleaners').doc(data.cleaner_id).get() : Promise.resolve(null),
    db.collection('payments').where('booking_id', '==', id).get(),
  ])

  return {
    id,
    ...(data as Omit<Booking, 'id'>),
    service_types: serviceSnap ? (docData<ServiceType>(serviceSnap) ?? undefined) : undefined,
    cleaners: cleanerSnap ? (docData<Cleaner>(cleanerSnap) ?? undefined) : undefined,
    payments: queryData(paymentsSnap),
  }
}

const handler: Handler = async (event) => {
  try {
    return await route(event)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return serverError(err instanceof Error ? err.message : "Kutilmagan xatolik.")
  }
}

async function route(event: HandlerEvent): Promise<HandlerResponse> {
  const req = await authenticate(event)
  if (!req) return unauthorized()
  const db = getDb()

  const id = event.queryStringParameters?.id

  // ---------- GET: list (mine, or everything if admin) / single ----------
  if (event.httpMethod === 'GET') {
    if (id) {
      const snap = await db.collection('bookings').doc(id).get()
      if (!snap.exists) return notFound()
      const data = snap.data()!
      if (!isAdmin(req) && data.customer_id !== req.uid) return forbidden()
      return json(200, await enrichBooking(db, id, data))
    }

    const query = isAdmin(req)
      ? db.collection('bookings')
      : db.collection('bookings').where('customer_id', '==', req.uid)
    const snap = await query.get()
    const rows = await Promise.all(snap.docs.map((d) => enrichBooking(db, d.id, d.data())))
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return json(200, rows)
  }

  // ---------- POST: create a booking (price recomputed server-side) ----------
  if (event.httpMethod === 'POST') {
    let body: CreateBookingBody
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    if (!body.serviceId || !body.address || !body.date || !body.time || !body.contactPhone) {
      return badRequest("Majburiy maydonlar to'ldirilmagan.")
    }

    const WORKING_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    if (!WORKING_HOURS.includes(body.time)) {
      return badRequest("Ish vaqti faqat 09:00 dan 18:00 gacha bo'lishi kerak.")
    }

    const existingBookingSnap = await db
      .collection('bookings')
      .where('scheduled_date', '==', body.date)
      .where('scheduled_time', '==', body.time)
      .get()

    const hasActiveBooking = existingBookingSnap.docs.some((doc) => doc.data().status !== 'cancelled')
    if (hasActiveBooking) {
      return badRequest("Ushbu vaqt allaqachon band qilingan. Iltimos, boshqa vaqtni tanlang.")
    }

    const serviceSnap = await db.collection('serviceTypes').doc(body.serviceId).get()
    const service = docData<ServiceType>(serviceSnap)
    if (!service || !service.is_active) return badRequest('Xizmat turi topilmadi.')

    const addonsSnap = await db.collection('addons').where('is_active', '==', true).get()
    const allAddons = queryData<Addon>(addonsSnap)
    const selectedAddons = allAddons.filter((a) => (body.addonCodes ?? []).includes(a.code))

    const tier: BookingTier = VALID_TIERS.includes(body.tier as BookingTier) ? (body.tier as BookingTier) : 'standard'

    // Repair project photos/notes - optional, only meaningful for the
    // repair category, but harmless to store either way. Validated
    // server-side (count + size) since these land straight on a Firestore
    // document (1 MiB cap) same as payment receipts.
    const repairPhotos = Array.isArray(body.repairPhotos) ? body.repairPhotos.slice(0, MAX_REPAIR_PHOTOS) : []
    for (const photo of repairPhotos) {
      if (typeof photo !== 'string' || photo.length > MAX_REPAIR_PHOTO_LENGTH) {
        return badRequest("Loyiha rasmi juda katta yoki noto'g'ri formatda.")
      }
    }
    const repairNotes = typeof body.repairNotes === 'string' ? body.repairNotes.slice(0, MAX_REPAIR_NOTES_LENGTH) : null

    // Automatic new-customer / referral discount - never trust a
    // client-sent flag, determine both eligibility conditions server-side.
    let extraDiscountRate = 0
    let extraDiscountKind: 'referral' | 'first' | null = null
    if (req.profile?.referral_discount_pending) {
      extraDiscountRate = REFERRAL_REFERRED_DISCOUNT
      extraDiscountKind = 'referral'
    } else {
      const priorSnap = await db.collection('bookings').where('customer_id', '==', req.uid).limit(1).get()
      if (priorSnap.empty) {
        extraDiscountRate = FIRST_BOOKING_DISCOUNT
        extraDiscountKind = 'first'
      }
    }

    // Never trust client-sent prices - recompute from the source of truth.
    const price = calculatePrice({
      service,
      rooms: Number(body.rooms) || 1,
      areaSqm: body.areaSqm ? Number(body.areaSqm) : null,
      selectedAddons,
      frequency: body.frequency ?? 'once',
      tier,
      floor: body.floor ? Number(body.floor) : null,
      extraDiscountRate,
    })

    const now = new Date().toISOString()
    const newBooking = {
      customer_id: req.uid,
      service_type_id: service.id,
      cleaner_id: null,
      property_type: service.property_type,
      rooms: body.rooms,
      area_sqm: body.areaSqm ? Number(body.areaSqm) : null,
      address: body.address,
      city: body.city || 'Toshkent',
      scheduled_date: body.date,
      scheduled_time: body.time,
      frequency: body.frequency ?? 'once',
      tier,
      addon_codes: body.addonCodes ?? [],
      contact_name: body.contactName || req.profile?.full_name || null,
      contact_phone: body.contactPhone,
      notes: body.notes ?? null,
      repair_photos: repairPhotos,
      repair_notes: repairNotes,
      base_amount: price.subtotal,
      discount_amount: price.discountAmount,
      total_amount: price.totalAmount,
      currency: 'UZS',
      status: 'pending' as const,
      created_at: now,
      updated_at: now,
    }

    const ref = await db.collection('bookings').add(newBooking)
    const booking = await enrichBooking(db, ref.id, newBooking)

    // If a referral discount was just used, clear the pending flag and
    // link the redemption row to this booking so the PATCH handler below
    // knows to reward the referrer once it's marked 'completed'.
    if (extraDiscountKind === 'referral') {
      await db.collection('profiles').doc(req.uid).update({ referral_discount_pending: false })
      const redemptionSnap = await db
        .collection('referralRedemptions')
        .where('referred_uid', '==', req.uid)
        .where('status', '==', 'pending')
        .limit(1)
        .get()
      if (!redemptionSnap.empty) {
        await redemptionSnap.docs[0].ref.update({ status: 'booked', booking_id: booking.id })
      }
    }

    await notifyTelegram(
      formatBookingCreatedMessage({
        serviceName: service.name_uz,
        contactName: booking.contact_name ?? '',
        contactPhone: booking.contact_phone,
        address: booking.address,
        city: booking.city,
        date: booking.scheduled_date,
        time: booking.scheduled_time,
        totalAmountUZS: booking.total_amount,
        bookingId: booking.id,
        repairNotes: booking.repair_notes ?? undefined,
        repairPhotoCount: booking.repair_photos?.length ?? 0,
      }),
    )

    return json(201, booking)
  }

  // ---------- PATCH: admin updates status / assigns a cleaner ----------
  if (event.httpMethod === 'PATCH') {
    if (!id) return badRequest('id kerak.')
    if (!isAdmin(req)) return forbidden()

    let body: { status?: string; cleaner_id?: string | null; total_amount?: number }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    const VALID_STATUSES = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) return badRequest("Noto'g'ri holat qiymati.")
      patch.status = body.status
    }
    if ('cleaner_id' in body) patch.cleaner_id = body.cleaner_id || null
    // Manual price override - mainly for repair/renovation quotes, where
    // the admin reviews the customer's uploaded photos/description (see
    // repair_photos/repair_notes) and adjusts the flat per-sqm estimate to
    // a real quote. Works for any booking, not just repair ones.
    if ('total_amount' in body) {
      const amount = Number(body.total_amount)
      if (!Number.isFinite(amount) || amount < 0) return badRequest("Noto'g'ri summa.")
      patch.total_amount = Math.round(amount)
    }
    if (Object.keys(patch).length === 1) return badRequest("O'zgartiriladigan maydon yo'q.")

    const ref = db.collection('bookings').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()
    const before = snap.data()!

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ref.update(patch as any)
    const updated = await ref.get()
    const updatedData = updated.data()!

    // Referral reward: once a referred customer's booking is marked
    // 'completed', credit the referrer (see _lib/referral.ts - manually
    // applied by the admin, there's no auto-payout rail here).
    if (patch.status === 'completed' && before.status !== 'completed' && updatedData.customer_id) {
      const redemptionSnap = await db
        .collection('referralRedemptions')
        .where('referred_uid', '==', updatedData.customer_id)
        .where('booking_id', '==', id)
        .where('status', '==', 'booked')
        .limit(1)
        .get()
      if (!redemptionSnap.empty) {
        const redemption = redemptionSnap.docs[0]
        const referrerUid = redemption.data().referrer_uid as string
        await redemption.ref.update({ status: 'rewarded', rewarded_at: new Date().toISOString() })
        const referrerRef = db.collection('profiles').doc(referrerUid)
        const referrerSnap = await referrerRef.get()
        const currentCredits = Number(referrerSnap.data()?.referral_credits_uzs ?? 0)
        await referrerRef.set({ referral_credits_uzs: currentCredits + REFERRAL_REWARD_UZS }, { merge: true })
        await notifyTelegram(formatReferralRewardMessage({ referrerUid, rewardUZS: REFERRAL_REWARD_UZS, bookingId: id }))
      }
    }

    return json(200, await enrichBooking(db, id, updatedData))
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
