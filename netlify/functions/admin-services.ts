import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { queryData } from './_lib/firestoreUtil'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'
import type { ServiceType } from '../../src/lib/types'

/**
 * Admin-only CRUD for serviceTypes (pricing). Public read of active
 * services still happens client-side via Firestore
 * (src/pages/Services.tsx, Booking.tsx) - this endpoint is only for the
 * admin panel, which also needs to see inactive services and edit prices.
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
  if (!isAdmin(req)) return forbidden()
  const db = getDb()

  if (event.httpMethod === 'GET') {
    const snap = await db.collection('serviceTypes').get()
    const rows = queryData<ServiceType>(snap)
    rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return json(200, rows)
  }

  if (event.httpMethod === 'POST') {
    let body: Partial<ServiceType>
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }
    if (!body.code || !body.name_uz || !body.property_type || !body.pricing_unit) {
      return badRequest("code, name_uz, property_type, pricing_unit majburiy.")
    }

    const now = new Date().toISOString()
    const doc = {
      code: body.code,
      name_uz: body.name_uz,
      name_en: body.name_en ?? null,
      name_ru: body.name_ru ?? null,
      description_uz: body.description_uz ?? null,
      property_type: body.property_type,
      pricing_unit: body.pricing_unit,
      base_price: Number(body.base_price) || 0,
      extra_unit_price: Number(body.extra_unit_price) || 0,
      min_price: Number(body.min_price) || 0,
      multiplier: Number(body.multiplier) || 1,
      is_active: body.is_active ?? true,
      sort_order: Number(body.sort_order) || 0,
      // 'cleaning' or 'repair' - which tab the service shows under on the
      // Booking page. Defaults to 'cleaning' for backward compatibility.
      category: body.category === 'repair' ? 'repair' : 'cleaning',
      image: body.image ?? null,
      floor_multiplier: body.floor_multiplier ? Number(body.floor_multiplier) : null,
      created_at: now,
    }
    const ref = await db.collection('serviceTypes').add(doc)
    const created = await ref.get()
    return json(201, { id: ref.id, ...created.data() })
  }

  if (event.httpMethod === 'PATCH') {
    const id = event.queryStringParameters?.id
    if (!id) return badRequest('id kerak.')

    let body: Record<string, unknown>
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    const allowed = [
      'name_uz',
      'name_en',
      'name_ru',
      'description_uz',
      'base_price',
      'extra_unit_price',
      'min_price',
      'multiplier',
      'is_active',
      'sort_order',
      'category',
      'image',
      'floor_multiplier',
    ] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) if (key in body) patch[key] = body[key]
    if (Object.keys(patch).length === 0) return badRequest("O'zgartiriladigan maydon yo'q.")

    const ref = db.collection('serviceTypes').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()

    await ref.update(patch)
    const updated = await ref.get()
    return json(200, { id: updated.id, ...updated.data() })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
