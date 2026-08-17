import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { getAdminAuth, getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { badRequest, json, serverError } from './_lib/respond'

const MAX_ATTEMPTS = 5

/**
 * POST /.netlify/functions/telegram-login-verify { phone, code }
 *
 * Second step of the Telegram phone/password login flow (see
 * telegram-login-request.ts). On success, mints a Firebase custom auth
 * token so the client can call signInWithCustomToken() and get a normal
 * Firebase session - from that point on the rest of the app (AuthContext,
 * apiFetch, etc.) works exactly like an email/password login.
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
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let body: { phone?: string; code?: string }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest("Noto'g'ri so'rov.")
  }

  const phone = normalizeUzPhone(body.phone ?? '')
  if (!phone || !body.code) {
    return badRequest('Telefon raqam va kod kerak.')
  }

  const db = getDb()
  const codeRef = db.collection('telegramLoginCodes').doc(phone)
  const snap = await codeRef.get()
  if (!snap.exists) {
    return badRequest("Kod topilmadi. Avval kod so'rang.")
  }
  const data = snap.data()!

  if (new Date(data.expires_at).getTime() < Date.now()) {
    await codeRef.delete()
    return badRequest("Kodning muddati tugagan. Qaytadan so'rang.")
  }

  if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
    await codeRef.delete()
    return badRequest("Urinishlar soni tugadi. Qaytadan kod so'rang.")
  }

  if (String(body.code).trim() !== data.code) {
    await codeRef.update({ attempts: (data.attempts ?? 0) + 1 })
    return badRequest("Kod noto'g'ri.")
  }

  await codeRef.delete()

  const token = await getAdminAuth().createCustomToken(data.uid)
  return json(200, { token })
}

export { handler }
