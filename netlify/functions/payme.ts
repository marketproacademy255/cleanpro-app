// Netlify Function: Payme Merchant API (JSON-RPC 2.0)
//
// This implements the standard Payme merchant webhook methods:
// CheckPerformTransaction, CreateTransaction, PerformTransaction,
// CancelTransaction, CheckTransaction, GetStatement.
//
// SETUP:
//   1. Register as a merchant at https://business.payme.uz
//   2. Set this function's URL as your "Payment URL" in the Payme cabinet:
//        https://<your-site>.netlify.app/.netlify/functions/payme
//   3. Set PAYME_MERCHANT_KEY in Netlify env vars (Site settings ->
//      Environment variables).
//   4. Review this file against the latest Payme docs
//      (https://developer.help.paycom.uz) before going to production -
//      this is a solid starting point, not a certified integration.
//
// eslint-disable @typescript-eslint/no-explicit-any
import type { Handler } from '@netlify/functions'
import { getDb } from './_lib/firebaseAdmin'
import { rawBody } from './_lib/parseBody'
import { formatPaymentConfirmedMessage, notifyTelegram } from './_lib/telegram'
import { safeEqual } from './_lib/safeEqual'

const PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY ?? ''

const ERROR = {
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  UNABLE_TO_PERFORM: -31008,
  ORDER_NOT_FOUND: -31050,
  ALREADY_PERFORMED: -31051,
  INSUFFICIENT_PRIVILEGE: -32504,
  METHOD_NOT_FOUND: -32601,
  PARSE_ERROR: -32700,
}

function rpcResult(id: unknown, result: unknown) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, result }) }
}

function rpcError(id: unknown, code: number, message: string) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, error: { code, message: { uz: message, ru: message, en: message } } }),
  }
}

function checkAuth(authHeader: string | undefined): boolean {
  if (!authHeader?.startsWith('Basic ')) return false
  try {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
    const [login, key] = decoded.split(':')
    return login === 'Paycom' && safeEqual(key ?? '', PAYME_MERCHANT_KEY)
  } catch {
    return false
  }
}

async function findBooking(db: FirebaseFirestore.Firestore, orderId: string) {
  const snap = await db.collection('bookings').doc(orderId).get()
  return snap.exists ? { id: snap.id, ...snap.data()! } : null
}

async function findPayment(db: FirebaseFirestore.Firestore, transactionId: string) {
  const snap = await db
    .collection('payments')
    .where('provider', '==', 'payme')
    .where('provider_transaction_id', '==', transactionId)
    .limit(1)
    .get()
  return snap.empty ? null : { id: snap.docs[0]!.id, ...snap.docs[0]!.data()! }
}

async function checkPerformTransaction(db: FirebaseFirestore.Firestore, id: unknown, params: any) {
  const orderId = params?.account?.order_id
  const booking = orderId ? await findBooking(db, orderId) : null
  if (!booking) return rpcError(id, ERROR.ORDER_NOT_FOUND, 'Order not found')

  const expectedTiyin = Math.round(Number(booking.total_amount) * 100)
  if (Number(params.amount) !== expectedTiyin) {
    return rpcError(id, ERROR.INVALID_AMOUNT, 'Incorrect amount')
  }
  return rpcResult(id, { allow: true })
}

async function createTransaction(db: FirebaseFirestore.Firestore, id: unknown, params: any) {
  const orderId = params?.account?.order_id
  const booking = orderId ? await findBooking(db, orderId) : null
  if (!booking) return rpcError(id, ERROR.ORDER_NOT_FOUND, 'Order not found')

  const existing = await findPayment(db, params.id)
  if (existing) {
    if (existing.state === '2') {
      return rpcError(id, ERROR.ALREADY_PERFORMED, 'Transaction already performed')
    }
    return rpcResult(id, {
      create_time: new Date(existing.created_at).getTime(),
      transaction: existing.id,
      state: 1,
    })
  }

  const expectedTiyin = Math.round(Number(booking.total_amount) * 100)
  if (Number(params.amount) !== expectedTiyin) {
    return rpcError(id, ERROR.INVALID_AMOUNT, 'Incorrect amount')
  }

  const now = new Date().toISOString()
  const ref = await db.collection('payments').add({
    booking_id: booking.id,
    provider: 'payme',
    provider_transaction_id: params.id,
    amount: booking.total_amount,
    state: '1',
    status: 'pending',
    raw_payload: params,
    created_at: now,
    updated_at: now,
    performed_at: null,
    cancelled_at: null,
  })

  return rpcResult(id, { create_time: new Date(now).getTime(), transaction: ref.id, state: 1 })
}

async function performTransaction(db: FirebaseFirestore.Firestore, id: unknown, params: any) {
  const payment = await findPayment(db, params.id)
  if (!payment) return rpcError(id, ERROR.TRANSACTION_NOT_FOUND, 'Transaction not found')

  if (payment.state === '2') {
    return rpcResult(id, {
      transaction: payment.id,
      perform_time: new Date(payment.performed_at).getTime(),
      state: 2,
    })
  }

  const now = new Date().toISOString()
  await db.collection('payments').doc(payment.id).update({ state: '2', status: 'paid', performed_at: now, updated_at: now })
  const bookingRef = db.collection('bookings').doc(payment.booking_id)
  await bookingRef.update({ status: 'confirmed', updated_at: now })
  const booking = (await bookingRef.get()).data()

  await notifyTelegram(
    formatPaymentConfirmedMessage({
      provider: 'payme',
      contactName: booking?.contact_name ?? '',
      contactPhone: booking?.contact_phone ?? '',
      address: booking ? `${booking.address}, ${booking.city}` : '',
      amountUZS: Number(payment.amount),
      bookingId: payment.booking_id,
    }),
  )

  return rpcResult(id, { transaction: payment.id, perform_time: new Date(now).getTime(), state: 2 })
}

async function cancelTransaction(db: FirebaseFirestore.Firestore, id: unknown, params: any) {
  const payment = await findPayment(db, params.id)
  if (!payment) return rpcError(id, ERROR.TRANSACTION_NOT_FOUND, 'Transaction not found')

  const newState = payment.state === '2' ? '-2' : '-1'
  const now = new Date().toISOString()
  await db.collection('payments').doc(payment.id).update({ state: newState, status: 'cancelled', cancelled_at: now, updated_at: now })
  await db.collection('bookings').doc(payment.booking_id).update({ status: 'cancelled', updated_at: now })

  return rpcResult(id, { transaction: payment.id, cancel_time: new Date(now).getTime(), state: Number(newState) })
}

async function checkTransaction(db: FirebaseFirestore.Firestore, id: unknown, params: any) {
  const payment = await findPayment(db, params.id)
  if (!payment) return rpcError(id, ERROR.TRANSACTION_NOT_FOUND, 'Transaction not found')

  return rpcResult(id, {
    create_time: new Date(payment.created_at).getTime(),
    perform_time: payment.performed_at ? new Date(payment.performed_at).getTime() : 0,
    cancel_time: payment.cancelled_at ? new Date(payment.cancelled_at).getTime() : 0,
    transaction: payment.id,
    state: Number(payment.state ?? 1),
    reason: null,
  })
}

async function getStatement(db: FirebaseFirestore.Firestore, id: unknown, params: any) {
  const fromIso = new Date(params.from).toISOString()
  const toIso = new Date(params.to).toISOString()
  const snap = await db
    .collection('payments')
    .where('provider', '==', 'payme')
    .where('created_at', '>=', fromIso)
    .where('created_at', '<=', toIso)
    .get()

  const transactions = snap.docs.map((doc) => {
    const p = doc.data()
    return {
      id: p.provider_transaction_id,
      time: new Date(p.created_at).getTime(),
      amount: Math.round(Number(p.amount) * 100),
      account: { order_id: p.booking_id },
      create_time: new Date(p.created_at).getTime(),
      perform_time: p.performed_at ? new Date(p.performed_at).getTime() : 0,
      cancel_time: p.cancelled_at ? new Date(p.cancelled_at).getTime() : 0,
      transaction: doc.id,
      state: Number(p.state ?? 1),
      reason: null,
    }
  })

  return rpcResult(id, { transactions })
}

const handler: Handler = async (event) => {
  let body: any
  try {
    body = JSON.parse(rawBody(event) || '{}')
  } catch {
    return rpcError(null, ERROR.PARSE_ERROR, 'Parse error')
  }

  const { method, params, id } = body ?? {}
  const authHeader = event.headers.authorization ?? event.headers.Authorization

  if (!checkAuth(authHeader)) {
    return rpcError(id ?? null, ERROR.INSUFFICIENT_PRIVILEGE, 'Authorization failed')
  }

  const db = getDb()

  try {
    switch (method) {
      case 'CheckPerformTransaction':
        return await checkPerformTransaction(db, id, params)
      case 'CreateTransaction':
        return await createTransaction(db, id, params)
      case 'PerformTransaction':
        return await performTransaction(db, id, params)
      case 'CancelTransaction':
        return await cancelTransaction(db, id, params)
      case 'CheckTransaction':
        return await checkTransaction(db, id, params)
      case 'GetStatement':
        return await getStatement(db, id, params)
      default:
        return rpcError(id, ERROR.METHOD_NOT_FOUND, 'Method not found')
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return rpcError(id, ERROR.UNABLE_TO_PERFORM, 'Internal error')
  }
}

export { handler }
