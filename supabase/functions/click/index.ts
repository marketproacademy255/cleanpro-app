// Supabase Edge Function: Click Merchant webhook (Prepare + Complete)
//
// SETUP:
//   1. Register as a merchant at https://merchant.click.uz
//   2. Set this function's URL as your "Webhook URL" in the Click cabinet.
//   3. Store your Click secret key as a Supabase secret:
//        supabase secrets set CLICK_SECRET_KEY=xxxxx
//   4. Review this file against the latest Click docs
//      (https://docs.click.uz) before going to production — this is a
//      solid starting point, not a certified integration.
//
// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHash } from 'node:crypto'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CLICK_SECRET_KEY = Deno.env.get('CLICK_SECRET_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
}

async function parseParams(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await req.json()
  }
  const form = await req.formData()
  const obj: Record<string, string> = {}
  for (const [k, v] of form.entries()) obj[k] = String(v)
  return obj
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
  return md5(parts.join('')) === params.sign_string
}

async function prepare(params: Record<string, string>) {
  if (!verifySign(params, false)) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      error: CLICK_ERROR.SIGN_CHECK_FAILED,
      error_note: 'Sign check failed',
    })
  }

  const bookingId = params.merchant_trans_id
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
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

  const { data: payment, error } = await supabase
    .from('payments')
    .upsert(
      {
        booking_id: bookingId,
        provider: 'click',
        provider_transaction_id: params.click_trans_id,
        amount: booking.total_amount,
        state: '0',
        status: 'pending',
        raw_payload: params,
      },
      { onConflict: 'provider,provider_transaction_id' },
    )
    .select()
    .single()

  if (error || !payment) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      error: CLICK_ERROR.INTERNAL_ERROR,
      error_note: error?.message ?? 'Insert failed',
    })
  }

  return jsonResponse({
    click_trans_id: params.click_trans_id,
    merchant_trans_id: bookingId,
    merchant_prepare_id: payment.id,
    error: CLICK_ERROR.SUCCESS,
    error_note: 'Success',
  })
}

async function complete(params: Record<string, string>) {
  if (!verifySign(params, true)) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      error: CLICK_ERROR.SIGN_CHECK_FAILED,
      error_note: 'Sign check failed',
    })
  }

  const bookingId = params.merchant_trans_id
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider', 'click')
    .eq('provider_transaction_id', params.click_trans_id)
    .maybeSingle()

  if (!payment) {
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      error: CLICK_ERROR.TRANSACTION_NOT_FOUND,
      error_note: 'Transaction not found',
    })
  }

  if (Number(params.error) < 0) {
    await supabase
      .from('payments')
      .update({ state: '-1', status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', payment.id)
    return jsonResponse({
      click_trans_id: params.click_trans_id,
      merchant_trans_id: bookingId,
      merchant_confirm_id: payment.id,
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Cancelled',
    })
  }

  const now = new Date().toISOString()
  await supabase.from('payments').update({ state: '2', status: 'paid', performed_at: now }).eq('id', payment.id)
  await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', payment.booking_id)

  return jsonResponse({
    click_trans_id: params.click_trans_id,
    merchant_trans_id: bookingId,
    merchant_confirm_id: payment.id,
    error: CLICK_ERROR.SUCCESS,
    error_note: 'Success',
  })
}

Deno.serve(async (req) => {
  try {
    const params = await parseParams(req)
    if (params.action === '0') return await prepare(params)
    if (params.action === '1') return await complete(params)
    return jsonResponse({ error: CLICK_ERROR.ACTION_NOT_FOUND, error_note: 'Action not found' })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: CLICK_ERROR.INTERNAL_ERROR, error_note: 'Internal error' })
  }
})
