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

  if (event.httpMethod === 'PATCH') {
    const id = event.queryStringParameters?.id
    if (!id) return badRequest('id kerak.')

    let body: Record<string, unknown>
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    const allowed = ['base_price', 'extra_unit_price', 'min_price', 'multiplier', 'is_active'] as const
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
