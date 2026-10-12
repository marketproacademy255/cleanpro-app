import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { badRequest, json, serverError, unauthorized } from './_lib/respond'

/**
 * GET  /.netlify/functions/profile  -> returns the caller's own profile
 *      (auto-creates a minimal one if missing).
 * POST /.netlify/functions/profile  -> sets full_name/phone/language on
 *      the caller's own profile (called right after Firebase sign-up, and
 *      whenever the user switches the UI language while logged in - see
 *      the sync effect in AuthContext.tsx).
 *      `role` is intentionally never accepted from the client - it can
 *      only be changed directly in Firestore, never over the API, to
 *      prevent a customer from granting themselves admin.
 */
const VALID_LANGS = ['uz', 'en', 'ru']
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
    let body: { full_name?: string; phone?: string; language?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    // Phone is stored normalized so it matches what the Telegram bot
    // verifies. Changing it drops the verified flag - only the bot (see
    // _lib/phoneVerification.ts) can set phone_verified back to true.
    let phone = req.profile?.phone ?? null
    let phoneVerified = req.profile?.phone_verified === true
    if (body.phone !== undefined) {
      const normalized = normalizeUzPhone(body.phone)
      if (!normalized) return badRequest("Noto'g'ri O'zbekiston telefon raqami. Masalan: +998 90 123 45 67")
      if (normalized !== phone) {
        phone = normalized
        phoneVerified = false
      }
    }

    const db = getDb()
    const ref = db.collection('profiles').doc(req.uid)
    const patch = {
      email: req.email,
      full_name: body.full_name ?? req.profile?.full_name ?? null,
      phone,
      phone_verified: phoneVerified,
      language: body.language && VALID_LANGS.includes(body.language) ? body.language : (req.profile?.language ?? null),
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
