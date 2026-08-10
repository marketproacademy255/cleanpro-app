import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { badRequest, json, serverError, unauthorized } from './_lib/respond'

/**
 * GET  /.netlify/functions/profile  -> returns the caller's own profile
 *      (auto-creates a minimal one if missing).
 * POST /.netlify/functions/profile  -> sets full_name/phone on the
 *      caller's own profile (called right after Firebase sign-up).
 *      `role` is intentionally never accepted from the client - it can
 *      only be changed directly in Firestore, never over the API, to
 *      prevent a customer from granting themselves admin.
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

  if (event.httpMethod === 'GET') {
    return json(200, req.profile)
  }

  if (event.httpMethod === 'POST') {
    let body: { full_name?: string; phone?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    const db = getDb()
    const ref = db.collection('profiles').doc(req.uid)
    const patch = {
      email: req.email,
      full_name: body.full_name ?? req.profile?.full_name ?? null,
      phone: body.phone ?? req.profile?.phone ?? null,
      role: req.profile?.role ?? 'customer',
      created_at: req.profile?.created_at ?? new Date().toISOString(),
    }

    await ref.set(patch, { merge: true })
    const updated = await ref.get()
    return json(200, { id: updated.id, ...updated.data() })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
