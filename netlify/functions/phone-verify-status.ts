import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { isExpired, type PhoneVerificationDoc } from './_lib/phoneVerification'
import { checkRateLimit } from './_lib/rateLimit'
import { json, serverError, tooManyRequests, unauthorized } from './_lib/respond'

/**
 * GET /.netlify/functions/phone-verify-status   (auth required)
 *
 * Polled by /verify-phone while the user is in the Telegram bot. Only ever
 * reports on the CALLER's own request - no phone parameter, no tokens.
 */
export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' })

  try {
    const req = await authenticate(event)
    if (!req) return unauthorized()

    const allowed = await checkRateLimit(`phone-verify-status:${req.uid}`, 60, 60 * 1000)
    if (!allowed) return tooManyRequests()

    if (req.profile?.phone_verified) {
      return json(200, { status: 'verified', phone: req.profile.phone })
    }

    const snap = await getDb().collection('phoneVerifications').doc(req.uid).get()
    if (!snap.exists) return json(200, { status: 'none' })

    const data = snap.data() as PhoneVerificationDoc
    const status = data.status === 'pending' && isExpired(data) ? 'expired' : data.status
    return json(200, { status, phone: data.phone })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('phone-verify-status error:', err)
    return serverError()
  }
}
