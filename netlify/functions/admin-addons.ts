import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { queryData } from './_lib/firestoreUtil'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'
import type { Addon } from '../../src/lib/types'

/**
 * Admin-only CRUD for addons (extra services). Public read of active
 * addons still happens client-side via Firestore (src/pages/Booking.tsx) -
 * this endpoint is only for the admin panel, which also needs to see
 * inactive addons and add/edit them.
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
    const snap = await db.collection('addons').get()
    const rows = queryData<Addon>(snap)
    rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return json(200, rows)
  }

  if (event.httpMethod === 'POST') {
    let body: Partial<Addon>
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }
    if (!body.code || !body.name_uz) return badRequest('code va name_uz majburiy.')

    const doc = {
      code: body.code,
      name_uz: body.name_uz,
      price: Number(body.price) || 0,
      is_active: body.is_active ?? true,
      sort_order: Number(body.sort_order) || 0,
    }
    const ref = await db.collection('addons').add(doc)
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

    const allowed = ['name_uz', 'price', 'is_active', 'sort_order'] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) if (key in body) patch[key] = body[key]
    if (Object.keys(patch).length === 0) return badRequest("O'zgartiriladigan maydon yo'q.")

    const ref = db.collection('addons').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()

    await ref.update(patch)
    const updated = await ref.get()
    return json(200, { id: updated.id, ...updated.data() })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
