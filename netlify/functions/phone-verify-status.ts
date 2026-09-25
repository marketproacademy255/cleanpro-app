import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { badRequest, json, serverError } from './_lib/respond'

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' })
  }

  const rawPhone = event.queryStringParameters?.phone
  if (!rawPhone) {
    return badRequest("Telefon raqami ko'rsatilmadi.")
  }

  const phoneNorm = normalizeUzPhone(rawPhone)
  if (!phoneNorm) {
    return badRequest("Noto'g'ri telefon raqami formati.")
  }

  try {
    const db = getDb()
    const snap = await db.collection('phoneVerifications').doc(phoneNorm).get()

    if (!snap.exists) {
      return json(200, { status: 'not_found' })
    }

    const data = snap.data()!
    return json(200, {
      status: data.status || 'pending',
      token: data.custom_token || null,
      uid: data.uid || null,
      phone: phoneNorm,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('phone-verify-status error:', err)
    return serverError(err instanceof Error ? err.message : "Xatolik yuz berdi.")
  }
}
