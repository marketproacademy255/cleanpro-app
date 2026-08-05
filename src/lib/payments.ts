/**
 * Helpers that build the checkout redirect URLs for Uzbekistan's two
 * dominant payment gateways: Payme and Click.
 *
 * Neither gateway requires a client-side SDK for a basic "redirect to
 * hosted checkout" flow — you build a URL (Payme) or query string (Click)
 * that encodes the merchant id, order id and amount, then send the user
 * there. The gateway calls back to our Supabase Edge Functions
 * (see supabase/functions/payme and supabase/functions/click) to confirm
 * or cancel the transaction server-side.
 *
 * IMPORTANT: VITE_PAYME_MERCHANT_ID / VITE_CLICK_MERCHANT_ID /
 * VITE_CLICK_SERVICE_ID are placeholders until you register as a merchant:
 *   - Payme:  https://business.payme.uz
 *   - Click:  https://merchant.click.uz
 */

const SOM_TO_TIYIN = 100

export function buildPaymeCheckoutUrl(params: {
  bookingId: string
  amountSom: number
  returnUrl: string
}): string {
  const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID
  const amountTiyin = Math.round(params.amountSom * SOM_TO_TIYIN)

  const raw = [
    `m=${merchantId}`,
    `ac.order_id=${params.bookingId}`,
    `a=${amountTiyin}`,
    `c=${params.returnUrl}`,
  ].join(';')

  const encoded = btoa(raw)
  return `https://checkout.paycom.uz/${encoded}`
}

export function buildClickCheckoutUrl(params: {
  bookingId: string
  amountSom: number
  returnUrl: string
}): string {
  const merchantId = import.meta.env.VITE_CLICK_MERCHANT_ID
  const serviceId = import.meta.env.VITE_CLICK_SERVICE_ID

  const search = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(params.amountSom),
    transaction_param: params.bookingId,
    return_url: params.returnUrl,
  })

  return `https://my.click.uz/services/pay?${search.toString()}`
}

export function paymentGatewaysConfigured(): { payme: boolean; click: boolean } {
  return {
    payme: Boolean(import.meta.env.VITE_PAYME_MERCHANT_ID),
    click: Boolean(import.meta.env.VITE_CLICK_MERCHANT_ID && import.meta.env.VITE_CLICK_SERVICE_ID),
  }
}
