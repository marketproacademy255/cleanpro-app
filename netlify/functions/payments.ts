import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'
import { formatReceiptUploadedMessage, notifyTelegram } from './_lib/telegram'

/**
 * POST /.netlify/functions/payments { booking_id, provider, receipt_url? }
 *
 * Registers a pending payment doc before redirecting the customer to the
 * Payme/Click hosted checkout, so the provider's webhook
 * (netlify/functions/payme|click) can match the incoming transaction back
 * to this booking. Also used for the manual "upload a bank transfer
 * receipt" flow (provider: 'manual') when Payme/Click merchant keys aren't
 * configured yet - the customer's browser compresses the receipt image (or
 * validates a small PDF) into a data: URL client-side (see
 * src/lib/receiptFile.ts, no Firebase Storage bucket needed) and calls
 * this with the resulting string.
 *
 * PATCH /.netlify/functions/payments?id=... { status } - admin-only, used
 * to mark a manual payment as paid/failed after reviewing the receipt.
 */
const handler: Handler = async (event) => {
  try {
    return await route(event)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return serverError(err instanceof Error ? err.message : 'Kutilmagan xatolik.')
  }
}

async function route(event: HandlerEvent): Promise<HandlerResponse> {
  const req = await authenticate(event)
  if (!req) return unauthorized()
  const db = getDb()
  const id = event.queryStringParameters?.id

  if (event.httpMethod === 'POST') {
    let body: { booking_id?: string; provider?: 'payme' | 'click' | 'manual'; receipt_url?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    if (!body.booking_id || !['payme', 'click', 'manual'].includes(body.provider ?? '')) {
      return badRequest("booking_id va provider ('payme' | 'click' | 'manual') kerak.")
    }
    if (body.provider === 'manual' && !body.receipt_url) {
      return badRequest('receipt_url kerak.')
    }

    const bookingSnap = await db.collection('bookings').doc(body.booking_id).get()
    if (!bookingSnap.exists) return notFound()
    const booking = bookingSnap.data()!
    if (!isAdmin(req) && booking.customer_id !== req.uid) return forbidden()

    const now = new Date().toISOString()

    // Re-uploading a receipt updates the existing pending manual payment
    // instead of piling up duplicate rows.
    if (body.provider === 'manual') {
      const existing = await db
        .collection('payments')
        .where('booking_id', '==', body.booking_id)
        .where('provider', '==', 'manual')
        .where('status', '==', 'pending')
        .limit(1)
        .get()

      if (!existing.empty) {
        const ref = existing.docs[0].ref
        await ref.update({ receipt_url: body.receipt_url, updated_at: now })
        const updated = await ref.get()
        await notifyTelegram(
          formatReceiptUploadedMessage({
            contactName: booking.contact_name ?? '',
            contactPhone: booking.contact_phone,
            address: booking.address,
            amountUZS: booking.total_amount,
            bookingId: bookingSnap.id,
            receiptUrl: body.receipt_url ?? '',
          }),
        )
        return json(200, { id: ref.id, ...updated.data() })
      }
    }

    const ref = await db.collection('payments').add({
      booking_id: bookingSnap.id,
      provider: body.provider,
      provider_transaction_id: null,
      amount: booking.total_amount,
      state: null,
      status: 'pending',
      receipt_url: body.receipt_url ?? null,
      raw_payload: null,
      created_at: now,
      updated_at: now,
      performed_at: null,
      cancelled_at: null,
    })

    if (body.provider === 'manual') {
      await notifyTelegram(
        formatReceiptUploadedMessage({
          contactName: booking.contact_name ?? '',
          contactPhone: booking.contact_phone,
          address: booking.address,
          amountUZS: booking.total_amount,
          bookingId: bookingSnap.id,
          receiptUrl: body.receipt_url ?? '',
        }),
      )
    }

    const created = await ref.get()
    return json(201, { id: ref.id, ...created.data() })
  }

  if (event.httpMethod === 'PATCH') {
    if (!id) return badRequest('id kerak.')
    if (!isAdmin(req)) return forbidden()

    let body: { status?: 'paid' | 'failed' | 'pending' }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }
    if (!body.status || !['paid', 'failed', 'pending'].includes(body.status)) {
      return badRequest("Noto'g'ri holat qiymati.")
    }

    const ref = db.collection('payments').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()

    const now = new Date().toISOString()
    await ref.update({
      status: body.status,
      updated_at: now,
      performed_at: body.status === 'paid' ? now : snap.data()?.performed_at ?? null,
    })
    const updated = await ref.get()
    return json(200, { id: updated.id, ...updated.data() })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
