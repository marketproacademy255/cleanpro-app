// Netlify Function: Click Merchant webhook (Prepare + Complete)
//
// SETUP:
//   1. Register as a merchant at https://merchant.click.uz
//   2. Set this function's URL as your "Webhook URL" in the Click cabinet:
//        https://<your-site>.netlify.app/.netlify/functions/click
//   3. Set CLICK_SECRET_KEY in Netlify env vars (Site settings ->
//      Environment variables).
//   4. Review this file against the latest Click docs
//      (https://docs.click.uz) before going to production - this is a
//      solid starting point, not a certified integration.
//
// eslint-disable @typescript-eslint/no-explicit-any
import type { Handler } from '@netlify/functions'
import { createHash } from 'node:crypto'
import { getDb } from './_lib/firebaseAdmin'
import { parseFormOrJson } from './_lib/parseBody'
import { formatPaymentConfirmedMessage, notifyTelegram } from './_lib/telegram'
import { safeEqual } from './_lib/safeEqual'

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

async function findBooking(db: FirebaseFirestore.Firestore, id: string) {
  const snap = await db.collection('bookings').doc(id).get()
  return snap.exists ? { id: snap.id, ...snap.data()! } : null
}

async function findPaymentByClickTx(db: FirebaseFirestore.Firestore, clickTransId: string) {
  const snap = await db
    .collection('payments')
    .where('provider', '==', 'click')
    .where('provider_transaction_id', '==', clickTransId)
    .limit(1)
    .get()
  return snap.empty ? null : { id: snap.docs[0]!.id, ...snap.docs[0]!.data()! }
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
  const booking = await findBooking(db, bookingId)
  if (!booking) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      error: CLICK_ERROR.USER_NOT_FOUND,
      error_note: 'Order not found',
    })
  }

  const expectedAmount = Number(booking.total_amount)
  if (Math.abs(Number(params.amount) - expectedAmount) > 1) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      error: CLICK_ERROR.INCORRECT_AMOUNT,
      error_note: 'Incorrect amount',
    })
  }

  try {
    const existing = await findPaymentByClickTx(db, params.click_trans_id)
    const now = new Date().toISOString()
    const paymentData = {
      booking_id: bookingId,
      provider: 'click',
      provider_transaction_id: params.click_trans_id,
      amount: booking.total_amount,
      state: '0',
      status: 'pending',
      raw_payload: params,
      updated_at: now,
    }

    let paymentId: string
    if (existing) {
      await db.collection('payments').doc(existing.id).set(paymentData, { merge: true })
      paymentId = existing.id
    } else {
      const ref = await db.collection('payments').add({ ...paymentData, created_at: now, performed_at: null, cancelled_at: null })
      paymentId = ref.id
    }

    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      merchant_prepare_id: paymentId,
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Success',
    })
  } catch (err) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      error: CLICK_ERROR.INTERNAL_ERROR,
      error_note: err instanceof Error ? err.message : 'Insert failed',
    })
  }
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
  const payment = await findPaymentByClickTx(db, params.click_trans_id)

  if (!payment) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      error: CLICK_ERROR.TRANSACTION_NOT_FOUND,
      error_note: 'Transaction not found',
    })
  }

  const now = new Date().toISOString()

  if (Number(params.error) < 0) {
    await db.collection('payments').doc(payment.id).update({ state: '-1', status: 'cancelled', cancelled_at: now, updated_at: now })
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      merchant_confirm_id: payment.id,
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Cancelled',
    })
  }

  await db.collection('payments').doc(payment.id).update({ state: '2', status: 'paid', performed_at: now, updated_at: now })
  const bookingRef = db.collection('bookings').doc(payment.booking_id)
  await bookingRef.update({ status: 'confirmed', updated_at: now })
  const booking = (await bookingRef.get()).data()

  await notifyTelegram(
    formatPaymentConfirmedMessage({
      provider: 'click',
      contactName: booking?.contact_name ?? '',
      contactPhone: booking?.contact_phone ?? '',
      address: booking ? `${booking.address}, ${booking.city}` : '',
      amountUZS: Number(payment.amount),
      bookingId: payment.booking_id,
    }),
  )

  return jsonResponse({
    click_trans_id: params.click_trans_id,
    merchant_trans_id: bookingId,
    merchant_confirm_id: payment.id,
    error: CLICK_ERROR.SUCCESS,
    error_note: 'Success',
  })
}

const handler: Handler = async (event) => {
  try {
    const params = parseFormOrJson(event)
    const db = getDb()
    if (params.action === '0') return await prepare(db, params)
    if (params.action === '1') return await complete(db, params)
    return jsonResponse({ error: CLICK_ERROR.ACTION_NOT_FOUND, error_note: 'Action not found' })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return jsonResponse({ error: CLICK_ERROR.INTERNAL_ERROR, error_note: 'Internal error' })
  }
}

export { handler }
