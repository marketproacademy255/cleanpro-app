import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate, isAdmin } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from './_lib/respond'

/**
 * POST /.netlify/functions/payments { booking_id, provider }
 *
 * Registers a pending payment doc before redirecting the customer to the
 * Payme/Click hosted checkout, so the provider's webhook
 * (netlify/functions/payme|click) can match the incoming transaction back
 * to this booking.
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

  const req = await authenticate(event)
  if (!req) return unauthorized()
  const db = getDb()

  let body: { booking_id?: string; provider?: 'payme' | 'click' }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest("Noto'g'ri so'rov.")
  }

  if (!body.booking_id || (body.provider !== 'payme' && body.provider !== 'click')) {
    return badRequest("booking_id va provider ('payme' | 'click') kerak.")
  }

  const bookingSnap = await db.collection('bookings').doc(body.booking_id).get()
  if (!bookingSnap.exists) return notFound()
  const booking = bookingSnap.data()!
  if (!isAdmin(req) && booking.customer_id !== req.uid) return forbidden()

  const now = new Date().toISOString()
  const ref = await db.collection('payments').add({
    booking_id: bookingSnap.id,
    provider: body.provider,
    provider_transaction_id: null,
    amount: booking.total_amount,
    state: null,
    status: 'pending',
    raw_payload: null,
    created_at: now,
    updated_at: now,
    performed_at: null,
    cancelled_at: null,
  })
  const created = await ref.get()
  return json(201, { id: ref.id, ...created.data() })
}

export { handler }
