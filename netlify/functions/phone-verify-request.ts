import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { badRequest, json, serverError, tooManyRequests } from './_lib/respond'
import { checkRateLimit, getClientIp } from './_lib/rateLimit'

interface VerifyRequestBody {
  fullName: string
  phone: string
  email?: string
  password?: string
}

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const ip = getClientIp(event)
  const allowed = await checkRateLimit(`phone-verify-req:${ip}`, 10, 60 * 1000)
  if (!allowed) return tooManyRequests()

  let body: VerifyRequestBody
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest("Noto'g'ri so'rov formati.")
  }

  if (!body.phone || !body.fullName || !body.password) {
    return badRequest("Ism, telefon raqam va parol kiritilishi shart.")
  }

  const phoneNorm = normalizeUzPhone(body.phone)
  if (!phoneNorm) {
    return badRequest("Noto'g'ri O'zbekiston telefon raqami. Masalan: +998 90 123 45 67")
  }

  try {
    const db = getDb()

    // Check if profile with this phone already exists and is verified
    const existingProfileSnap = await db.collection('profiles').where('phone', '==', phoneNorm).get()
    if (!existingProfileSnap.empty) {
      const pData = existingProfileSnap.docs[0].data()
      if (pData.phone_verified) {
        return badRequest("Bu telefon raqami allaqachon ro'yxatdan o'tgan va tasdiqlangan.")
      }
    }

    const now = new Date().toISOString()
    await db.collection('phoneVerifications').doc(phoneNorm).set({
      phone: phoneNorm,
      full_name: body.fullName.trim(),
      email: body.email?.trim() || null,
      password_raw: body.password,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })

    const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || 'EMPIREsupport'

    return json(200, {
      ok: true,
      phone: phoneNorm,
      botUsername,
      message: "Tasdiqlash so'rovi yaratildi. Telegram botga o'ting.",
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('phone-verify-request error:', err)
    return serverError(err instanceof Error ? err.message : "Tasdiqlash so'rovida xatolik.")
  }
}
