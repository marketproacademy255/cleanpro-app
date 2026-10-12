import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { findOtherVerifiedOwner, newNonce, VERIFICATION_TTL_MS, type PhoneVerificationDoc } from './_lib/phoneVerification'
import { checkRateLimit, getClientIp } from './_lib/rateLimit'
import { badRequest, json, serverError, tooManyRequests, unauthorized } from './_lib/respond'

/**
 * POST /.netlify/functions/phone-verify-request { phone }   (auth required)
 *
 * Starts Telegram verification of the signed-in user's phone number and
 * returns the bot deep link to open. See _lib/phoneVerification.ts for the
 * full protocol.
 */
export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    const req = await authenticate(event)
    if (!req) return unauthorized()

    const allowed = await checkRateLimit(`phone-verify-req:${getClientIp(event)}:${req.uid}`, 5, 10 * 60 * 1000)
    if (!allowed) return tooManyRequests()

    let body: { phone?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov formati.")
    }

    const phone = normalizeUzPhone(body.phone ?? '')
    if (!phone) {
      return badRequest("Noto'g'ri O'zbekiston telefon raqami. Masalan: +998 90 123 45 67")
    }

    if (req.profile?.phone_verified && req.profile.phone === phone) {
      return json(200, { status: 'verified', phone })
    }

    const db = getDb()
    if (await findOtherVerifiedOwner(db, phone, req.uid)) {
      return json(409, { error: "Bu raqam boshqa akkauntda allaqachon tasdiqlangan. Iltimos, o'sha akkaunt bilan kiring." })
    }

    const now = new Date()
    const doc: PhoneVerificationDoc = {
      uid: req.uid,
      phone,
      nonce: newNonce(),
      status: 'pending',
      chat_id: null,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + VERIFICATION_TTL_MS).toISOString(),
      updated_at: now.toISOString(),
    }
    // One active request per user - a new request replaces the old one
    // (and invalidates its nonce).
    await db.collection('phoneVerifications').doc(req.uid).set(doc)

    const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || 'CleanVerificationBot'

    return json(200, {
      status: 'pending',
      phone,
      botUsername,
      botUrl: `https://t.me/${botUsername}?start=${doc.nonce}`,
      expiresAt: doc.expires_at,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('phone-verify-request error:', err)
    return serverError("Tasdiqlash so'rovida xatolik.")
  }
}
