// Supabase Edge Function: Payme Merchant API (JSON-RPC 2.0)
//
// This implements the standard Payme merchant webhook methods:
// CheckPerformTransaction, CreateTransaction, PerformTransaction,
// CancelTransaction, CheckTransaction, GetStatement.
//
// SETUP:
//   1. Register as a merchant at https://business.payme.uz
//   2. Set this function's URL as your "Payment URL" in the Payme cabinet.
//   3. Store your Payme secret key as a Supabase secret:
//        supabase secrets set PAYME_MERCHANT_KEY=xxxxx
//   4. Review this file against the latest Payme docs
//      (https://developer.help.paycom.uz) before going to production —
//      this is a solid starting point, not a certified integration.
//
// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYME_MERCHANT_KEY = Deno.env.get('PAYME_MERCHANT_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

function rpcError(id: unknown, code: number, message: string) {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message: { uz: message, ru: message, en: message } } }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

function checkAuth(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Basic ')) return false
  try {
    const decoded = atob(auth.slice(6))
    const [login, key] = decoded.split(':')
    return login === 'Paycom' && key === PAYME_MERCHANT_KEY
  } catch {
    return false
  }
}

async function findBooking(orderId: string) {
  const { data } = await supabase.from('bookings').select('*').eq('id', orderId).maybeSingle()
  return data
}

async function checkPerformTransaction(id: unknown, params: any) {
  const orderId = params?.account?.order_id
  const booking = orderId ? await findBooking(orderId) : null
  if (!booking) return rpcError(id, ERROR.ORDER_NOT_FOUND, 'Order not found')

  const expectedTiyin = Math.round(Number(booking.total_amount) * 100)
  if (Number(params.amount) !== expectedTiyin) {
    return rpcError(id, ERROR.INVALID_AMOUNT, 'Incorrect amount')
  }
  return rpcResult(id, { allow: true })
}

async function createTransaction(id: unknown, params: any) {
  const orderId = params?.account?.order_id
  const booking = orderId ? await findBooking(orderId) : null
  if (!booking) return rpcError(id, ERROR.ORDER_NOT_FOUND, 'Order not found')

  const { data: existing } = await supabase
    .from('payments')
    .select('*')
    .eq('provider', 'payme')
    .eq('provider_transaction_id', params.id)
    .maybeSingle()

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

  const { data: created, error } = await supabase
    .from('payments')
    .insert({
      booking_id: booking.id,
      provider: 'payme',
      provider_transaction_id: params.id,
      amount: booking.total_amount,
      state: '1',
      status: 'pending',
      raw_payload: params,
    })
    .select()
    .single()

  if (error || !created) return rpcError(id, ERROR.UNABLE_TO_PERFORM, error?.message ?? 'Insert failed')

  return rpcResult(id, {
    create_time: new Date(created.created_at).getTime(),
    transaction: created.id,
    state: 1,
  })
}

async function performTransaction(id: unknown, params: any) {
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider', 'payme')
    .eq('provider_transaction_id', params.id)
    .maybeSingle()

  if (!payment) return rpcError(id, ERROR.TRANSACTION_NOT_FOUND, 'Transaction not found')

  if (payment.state === '2') {
    return rpcResult(id, {
      transaction: payment.id,
      perform_time: new Date(payment.performed_at).getTime(),
      state: 2,
    })
  }

  const now = new Date().toISOString()
  await supabase.from('payments').update({ state: '2', status: 'paid', performed_at: now }).eq('id', payment.id)
  await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', payment.booking_id)

  return rpcResult(id, { transaction: payment.id, perform_time: new Date(now).getTime(), state: 2 })
}

async function cancelTransaction(id: unknown, params: any) {
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider', 'payme')
    .eq('provider_transaction_id', params.id)
    .maybeSingle()

  if (!payment) return rpcError(id, ERROR.TRANSACTION_NOT_FOUND, 'Transaction not found')

  const newState = payment.state === '2' ? '-2' : '-1'
  const now = new Date().toISOString()
  await supabase
    .from('payments')
    .update({ state: newState, status: 'cancelled', cancelled_at: now })
    .eq('id', payment.id)
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', payment.booking_id)

  return rpcResult(id, { transaction: payment.id, cancel_time: new Date(now).getTime(), state: Number(newState) })
}

async function checkTransaction(id: unknown, params: any) {
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider', 'payme')
    .eq('provider_transaction_id', params.id)
    .maybeSingle()

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

async function getStatement(id: unknown, params: any) {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('provider', 'payme')
    .gte('created_at', new Date(params.from).toISOString())
    .lte('created_at', new Date(params.to).toISOString())

  const transactions = (data ?? []).map((p: any) => ({
    id: p.provider_transaction_id,
    time: new Date(p.created_at).getTime(),
    amount: Math.round(Number(p.amount) * 100),
    account: { order_id: p.booking_id },
    create_time: new Date(p.created_at).getTime(),
    perform_time: p.performed_at ? new Date(p.performed_at).getTime() : 0,
    cancel_time: p.cancelled_at ? new Date(p.cancelled_at).getTime() : 0,
    transaction: p.id,
    state: Number(p.state ?? 1),
    reason: null,
  }))

  return rpcResult(id, { transactions })
}

Deno.serve(async (req) => {
  let body: any
  try {
    body = await req.json()
  } catch {
    return rpcError(null, ERROR.PARSE_ERROR, 'Parse error')
  }

  const { method, params, id } = body ?? {}

  if (!checkAuth(req)) {
    return rpcError(id ?? null, ERROR.INSUFFICIENT_PRIVILEGE, 'Authorization failed')
  }

  try {
    switch (method) {
      case 'CheckPerformTransaction':
        return await checkPerformTransaction(id, params)
      case 'CreateTransaction':
        return await createTransaction(id, params)
      case 'PerformTransaction':
        return await performTransaction(id, params)
      case 'CancelTransaction':
        return await cancelTransaction(id, params)
      case 'CheckTransaction':
        return await checkTransaction(id, params)
      case 'GetStatement':
        return await getStatement(id, params)
      default:
        return rpcError(id, ERROR.METHOD_NOT_FOUND, 'Method not found')
    }
  } catch (e) {
    console.error(e)
    return rpcError(id, ERROR.UNABLE_TO_PERFORM, 'Internal error')
  }
})
