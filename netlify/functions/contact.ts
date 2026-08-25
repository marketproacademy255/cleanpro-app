import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { badRequest, json, serverError, tooManyRequests } from './_lib/respond'
import { formatContactMessage, notifyTelegram } from './_lib/telegram'
import { checkRateLimit, getClientIp } from './_lib/rateLimit'

// Prevents a script from flooding the admin's Telegram chat with fake
// contact-form submissions.
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000

/**
 * POST /.netlify/functions/contact { name, contact, message }
 *
 * Public endpoint (no auth) behind the "Aloqa" (Contact) page form. Forwards
 * the message straight to the admin Telegram bot - there's no separate
 * inbox/ticket system yet, so this is the simplest way for a real message
 * to actually reach someone instead of just showing a fake "thank you" with
 * nothing sent anywhere.
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

  const ip = getClientIp(event)
  const allowed = await checkRateLimit(`contact:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!allowed) return tooManyRequests()

  let body: { name?: string; contact?: string; message?: string }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest("Noto'g'ri so'rov.")
  }

  const name = (body.name ?? '').trim()
  const contact = (body.contact ?? '').trim()
  const message = (body.message ?? '').trim()

  if (!name || !contact || !message) {
    return badRequest("Ism, aloqa va xabar maydonlari majburiy.")
  }
  if (name.length > 200 || contact.length > 200 || message.length > 4000) {
    return badRequest("Matn juda uzun.")
  }

  await notifyTelegram(formatContactMessage({ name, contact, message }))

  return json(200, { ok: true })
}

export { handler }
