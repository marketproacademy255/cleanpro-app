import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { queryData } from './_lib/firestoreUtil'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'
import type { Review } from '../../src/lib/types'

/**
 * Admin-only CRUD for manually-collected customer reviews (Admin >
 * Sharhlar). Public read of *approved* reviews happens client-side via
 * Firestore directly (src/lib/publicData.ts fetchApprovedReviews(), same
 * pattern as serviceTypes/addons/cleaners) - this endpoint is only for the
 * admin panel, which needs to see unapproved ones too and add/edit/delete.
 *
 * Reviews are added here by hand, after actually asking real customers -
 * never auto-generated. See TeamPreview.tsx's "if there's nothing real,
 * show nothing" principle, applied the same way on the Home page's rating
 * badge (src/pages/Home.tsx).
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
    const snap = await db.collection('reviews').get()
    const rows = queryData<Review>(snap)
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return json(200, rows)
  }

  if (event.httpMethod === 'POST') {
    let body: Partial<Review>
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }
    if (!body.customer_name || !body.comment || !body.rating) {
      return badRequest('customer_name, rating, comment majburiy.')
    }
    const rating = Number(body.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return badRequest("Reyting 1 dan 5 gacha bo'lishi kerak.")
    }

    const doc = {
      customer_name: String(body.customer_name).slice(0, 120),
      rating,
      comment: String(body.comment).slice(0, 1000),
      is_approved: body.is_approved ?? true,
      created_at: new Date().toISOString(),
    }
    const ref = await db.collection('reviews').add(doc)
    return json(201, { id: ref.id, ...doc })
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

    const allowed = ['customer_name', 'rating', 'comment', 'is_approved'] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) if (key in body) patch[key] = body[key]
    if (Object.keys(patch).length === 0) return badRequest("O'zgartiriladigan maydon yo'q.")

    const ref = db.collection('reviews').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()

    await ref.update(patch)
    const updated = await ref.get()
    return json(200, { id: updated.id, ...updated.data() })
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id
    if (!id) return badRequest('id kerak.')
    const ref = db.collection('reviews').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return notFound()
    await ref.delete()
    return json(200, { ok: true })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
