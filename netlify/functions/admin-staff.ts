import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { queryData } from './_lib/firestoreUtil'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'
import type { Cleaner } from '../../src/lib/types'

/**
 * Admin-only CRUD for cleaners (staff). Public read of active cleaners
 * still happens client-side via Firestore (src/pages/Services.tsx) - this
 * endpoint is only for the admin panel, which also needs to see inactive
 * staff and add/toggle them.
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
    const snap = await db.collection('cleaners').get()
    const rows = queryData<Cleaner>(snap)
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return json(200, rows)
  }

  if (event.httpMethod === 'POST') {
    let body: { full_name?: string; phone?: string; bio?: string; years_experience?: number }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }
    if (!body.full_name) return badRequest('Ism familiya kerak.')

    const ref = await db.collection('cleaners').add({
      profile_id: null,
      full_name: body.full_name,
      phone: body.phone ?? null,
      photo_url: null,
      bio: body.bio ?? null,
      years_experience: body.years_experience ?? 0,
      is_active: true,
      rating: 5.0,
      created_at: new Date().toISOString(),
    })
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

    const allowed = ['full_name', 'phone', 'bio', 'years_experience', 'is_active', 'photo_url'] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) if (key in body) patch[key] = body[key]
    if (Object.keys(patch).length === 0) return badRequest("O'zgartiriladigan maydon yo'q.")

    const ref = db.collection('cleaners').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()

    await ref.update(patch)
    const updated = await ref.get()
    return json(200, { id: updated.id, ...updated.data() })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
