import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import bcrypt from 'bcryptjs'
import { getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { sendTelegramDirectMessage } from './_lib/telegram'
import { badRequest, json, serverError } from './_lib/respond'

const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000

/**
 * POST /.netlify/functions/telegram-login-request { phone, password }
 *
 * First step of the "login with the phone/password you set in the
 * Telegram bot" flow. Checks the password against the hash the bot
 * stored, then sends a one-time code to the user's Telegram chat (not an
 * SMS - free, since we already have their chat_id from registration).
 * See telegram-login-verify.ts for the second step.
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

  let body: { phone?: string; password?: string }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest("Noto'g'ri so'rov.")
  }

  const phone = normalizeUzPhone(body.phone ?? '')
  if (!phone || !body.password) {
    return badRequest("Telefon raqam va parol kerak.")
  }

  const db = getDb()
  const authSnap = await db.collection('telegramAuth').doc(phone).get()
  if (!authSnap.exists) {
    return badRequest("Bu raqam ro'yxatdan o'tmagan. Avval Telegram bot orqali ro'yxatdan o'ting.")
  }
  const authData = authSnap.data()!

  const valid = await bcrypt.compare(body.password, authData.password_hash)
  if (!valid) {
    return badRequest("Telefon raqam yoki parol noto'g'ri.")
  }

  const codeRef = db.collection('telegramLoginCodes').doc(phone)
  const existing = await codeRef.get()
  const now = Date.now()
  if (existing.exists) {
    const lastSentAt = new Date(existing.data()?.created_at ?? 0).getTime()
    if (now - lastSentAt < RESEND_COOLDOWN_MS) {
      return badRequest("Juda tez-tez so'rov yubordingiz. Biroz kutib, qaytadan urinib ko'ring.")
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  await codeRef.set({
    code,
    uid: authData.uid,
    attempts: 0,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + CODE_TTL_MS).toISOString(),
  })

  const sent = await sendTelegramDirectMessage(
    authData.chat_id,
    `Sizning CleanPro kirish kodingiz: <b>${code}</b>\nKod 5 daqiqa amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, xabarni e'tiborsiz qoldiring.`,
  )
  if (!sent) {
    return serverError("Kodni yuborib bo'lmadi. Birozdan so'ng qaytadan urinib ko'ring.")
  }

  return json(200, { ok: true })
}

export { handler }
