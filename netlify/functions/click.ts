// Netlify Function: Click Merchant webhook (Prepare + Complete with Atomic Idempotency)
// eslint-disable @typescript-eslint/no-explicit-any
import type { Handler } from '@netlify/functions'
import { createHash } from 'node:crypto'
import { getDb } from './_lib/firebaseAdmin'
import { parseFormOrJson } from './_lib/parseBody'
import { formatPaymentConfirmedMessage, notifyTelegram } from './_lib/telegram'
import { safeEqual } from './_lib/safeEqual'
import { checkRateLimit, getClientIp } from './_lib/rateLimit'

const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY ?? ''

const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  INTERNAL_ERROR: -8,
}

function md5(str: string) {
  return createHash('md5').update(str).digest('hex')
}

function jsonResponse(body: Record<string, unknown>) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

function verifySign(params: Record<string, string>, isComplete: boolean) {
  const parts = isComplete
    ? [
        params.click_trans_id,
        params.service_id,
        CLICK_SECRET_KEY,
        params.merchant_trans_id,
        params.merchant_prepare_id,
        params.amount,
        params.action,
        params.sign_time,
      ]
    : [
        params.click_trans_id,
        params.service_id,
        CLICK_SECRET_KEY,
        params.merchant_trans_id,
        params.amount,
        params.action,
        params.sign_time,
      ]
  return safeEqual(md5(parts.join('')), params.sign_string ?? '')
}

async function prepare(db: FirebaseFirestore.Firestore, params: Record<string, string>) {
  if (!verifySign(params, false)) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      error: CLICK_ERROR.SIGN_CHECK_FAILED,
      error_note: 'Sign check failed',
    })
  }

  const bookingId = params.merchant_trans_id
  const clickTransId = params.click_trans_id

  return await db.runTransaction(async (transaction) => {
    const bookingRef = db.collection('bookings').doc(bookingId)
    const bookingSnap = await transaction.get(bookingRef)

    if (!bookingSnap.exists) {
      return jsonResponse({
        click_trans_id: clickTransId,
        merchant_trans_id: bookingId,
        error: CLICK_ERROR.USER_NOT_FOUND,
        error_note: 'Order not found',
      })
    }

    const booking = bookingSnap.data()!
    const expectedAmount = Number(booking.total_amount)
    if (Math.abs(Number(params.amount) - expectedAmount) > 1) {
      return jsonResponse({
        click_trans_id: clickTransId,
        merchant_trans_id: bookingId,
        error: CLICK_ERROR.INCORRECT_AMOUNT,
        error_note: 'Incorrect amount',
      })
    }

    // Check existing payment transaction
    const existingSnap = await db
      .collection('payments')
      .where('provider', '==', 'click')
      .where('provider_transaction_id', '==', clickTransId)
      .limit(1)
      .get()

    const now = new Date().toISOString()
    let paymentId: string

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0]!
      paymentId = existingDoc.id
      const existingData = existingDoc.data()

      // Idempotency: If already paid or prepared, return success response immediately
      if (existingData.status === 'paid' || existingData.state === '2') {
        return jsonResponse({
          click_trans_id: clickTransId,
          merchant_trans_id: bookingId,
          merchant_prepare_id: paymentId,
          error: CLICK_ERROR.SUCCESS,
          error_note: 'Already paid',
        })
      }

      transaction.set(
        existingDoc.ref,
        {
          booking_id: bookingId,
          provider: 'click',
          provider_transaction_id: clickTransId,
          amount: booking.total_amount,
          state: '0',
          status: 'pending',
          raw_payload: params,
          updated_at: now,
        },
        { merge: true },
      )
    } else {
      const paymentRef = db.collection('payments').doc()
      paymentId = paymentRef.id
      transaction.set(paymentRef, {
        booking_id: bookingId,
        provider: 'click',
        provider_transaction_id: clickTransId,
        amount: booking.total_amount,
        state: '0',
        status: 'pending',
        raw_payload: params,
        created_at: now,
        updated_at: now,
        performed_at: null,
        cancelled_at: null,
      })
    }

    return jsonResponse({
      click_trans_id: clickTransId,
      merchant_trans_id: bookingId,
      merchant_prepare_id: paymentId,
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Success',
    })
  })
}

async function complete(db: FirebaseFirestore.Firestore, params: Record<string, string>) {
  if (!verifySign(params, true)) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      error: CLICK_ERROR.SIGN_CHECK_FAILED,
      error_note: 'Sign check failed',
    })
  }

  const bookingId = params.merchant_trans_id
  const clickTransId = params.click_trans_id

  let shouldNotify = false
  let notifyParams: any = null

  const response = await db.runTransaction(async (transaction) => {
    const paymentSnap = await db
      .collection('payments')
      .where('provider', '==', 'click')
      .where('provider_transaction_id', '==', clickTransId)
      .limit(1)
      .get()

    if (paymentSnap.empty) {
      return jsonResponse({
        click_trans_id: clickTransId,
        merchant_trans_id: bookingId,
        error: CLICK_ERROR.TRANSACTION_NOT_FOUND,
        error_note: 'Transaction not found',
      })
    }

    const paymentDoc = paymentSnap.docs[0]!
    const paymentId = paymentDoc.id
    const paymentData = paymentDoc.data()
    const now = new Date().toISOString()

    // Idempotency: If already completed/paid, return success without duplicate actions or notifications
    if (paymentData.status === 'paid' || paymentData.state === '2') {
      return jsonResponse({
        click_trans_id: clickTransId,
        merchant_trans_id: bookingId,
        merchant_confirm_id: paymentId,
        error: CLICK_ERROR.SUCCESS,
        error_note: 'Already completed',
      })
    }

    if (Number(params.error) < 0) {
      transaction.update(paymentDoc.ref, {
        state: '-1',
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
      })
      return jsonResponse({
        click_trans_id: clickTransId,
        merchant_trans_id: bookingId,
        merchant_confirm_id: paymentId,
        error: CLICK_ERROR.SUCCESS,
        error_note: 'Cancelled',
      })
    }

    // Mark paid atomically
    transaction.update(paymentDoc.ref, {
      state: '2',
      status: 'paid',
      performed_at: now,
      updated_at: now,
    })

    const bookingRef = db.collection('bookings').doc(paymentData.booking_id)
    const bookingSnap = await transaction.get(bookingRef)
    const booking = bookingSnap.exists ? bookingSnap.data() : null

    transaction.update(bookingRef, { status: 'confirmed', updated_at: now })

    shouldNotify = true
    notifyParams = {
      provider: 'click',
      contactName: booking?.contact_name ?? '',
      contactPhone: booking?.contact_phone ?? '',
      address: booking ? `${booking.address}, ${booking.city}` : '',
      amountUZS: Number(paymentData.amount),
      bookingId: paymentData.booking_id,
      serviceName: booking?.service_name || booking?.service_type_id || 'Tozalash xizmati',
      date: booking?.scheduled_date || booking?.date || '',
      time: booking?.scheduled_time || booking?.time || '',
      apartment: booking?.apartment,
      floor: booking?.floor,
      entrance: booking?.entrance,
      intercom: booking?.intercom,
      landmark: booking?.landmark,
      lat: booking?.lat,
      lng: booking?.lng,
    }

    return jsonResponse({
      click_trans_id: clickTransId,
      merchant_trans_id: bookingId,
      merchant_confirm_id: paymentId,
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Success',
    })
  })

  // Trigger Telegram notification outside the transaction body
  if (shouldNotify && notifyParams) {
    await notifyTelegram(formatPaymentConfirmedMessage(notifyParams))
  }

  return response
}

const handler: Handler = async (event) => {
  const ip = getClientIp(event)
  const allowed = await checkRateLimit(`click-webhook:${ip}`, 30, 60 * 1000)
  if (!allowed) {
    return jsonResponse({ error: CLICK_ERROR.INTERNAL_ERROR, error_note: 'Rate limit exceeded' })
  }

  try {
    const params = parseFormOrJson(event)
    const db = getDb()
    if (params.action === '0') return await prepare(db, params)
    if (params.action === '1') return await complete(db, params)
    return jsonResponse({ error: CLICK_ERROR.ACTION_NOT_FOUND, error_note: 'Action not found' })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Click handler error:', err)
    return jsonResponse({ error: CLICK_ERROR.INTERNAL_ERROR, error_note: 'Internal error' })
  }
}

export { handler }
