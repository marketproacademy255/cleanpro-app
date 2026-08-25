import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { badRequest, json, serverError, tooManyRequests } from './_lib/respond'
import { checkRateLimit, getClientIp } from './_lib/rateLimit'

/**
 * POST /.netlify/functions/ai-chat { message, history? }
 *
 * Public endpoint (no auth) behind the floating "AI yordamchi" chat widget.
 * Proxies to OpenRouter server-side so the API key never reaches the
 * browser - Vite bundles anything VITE_-prefixed straight into client JS,
 * so a key like this can ONLY live here, read from process.env, same as
 * TELEGRAM_BOT_TOKEN / PAYME_MERCHANT_KEY elsewhere in netlify/functions.
 *
 * Set in Netlify dashboard only (never VITE_-prefixed):
 *   OPENROUTER_API_KEY   (required)
 *   OPENROUTER_MODEL     (optional, defaults below)
 */
const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const MAX_MESSAGE_LEN = 1000
const MAX_HISTORY = 8

// Every request here is a paid OpenRouter API call - cap it per IP so a
// script can't run up the bill (cost-based DoS).
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 1000

const SYSTEM_PROMPT = `Siz Prime Standard & Co (Toshkentda uy va ofis tozalash xizmati) saytidagi AI yordamchisiz.
Vazifangiz: tashrif buyuruvchilarning tozalash xizmatlari, narxlar tuzilishi, band qilish jarayoni haqidagi
savollariga qisqa, aniq va samimiy o'zbek tilida javob berish hamda ularni "/band-qilish" sahifasida
buyurtma berishga yo'naltirish.

Muhim qoidalar:
- Faqat Prime Standard & Co va uning xizmatlari haqida gapiring. Aloqasi yo'q mavzularda yordam berishdan
  muloyimlik bilan bosh torting va suhbatni xizmatlarga qaytaring.
- Aniq narx yoki muayyan buyurtma holatini bilmaysiz - buyurtma holatini bilish uchun "Shaxsiy kabinet"ga
  yoki to'g'ridan-to'g'ri operatorga (telefon/WhatsApp) murojaat qilishni tavsiya qiling.
- Hech qachon mavjud bo'lmagan chegirma, kafolat yoki xizmat haqida gapirmang.
- Javoblaringiz 2-4 gapdan oshmasin.`

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
  const allowed = await checkRateLimit(`ai-chat:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!allowed) return tooManyRequests()

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    // Same "degrade, don't crash" pattern as the rest of the app: the chat
    // widget catches this and falls back to the WhatsApp/phone links
    // instead of showing a broken chat box.
    return json(503, { error: "AI yordamchi hozircha sozlanmagan." })
  }

  let body: { message?: string; history?: { role?: string; content?: string }[] }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest("Noto'g'ri so'rov.")
  }

  const message = (body.message ?? '').trim()
  if (!message) return badRequest('Xabar bo\'sh bo\'lishi mumkin emas.')
  if (message.length > MAX_MESSAGE_LEN) return badRequest('Xabar juda uzun.')

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : []
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: String(m.content).slice(0, MAX_MESSAGE_LEN) })),
    { role: 'user', content: message },
  ]

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter-recommended identification headers (not secrets).
      'HTTP-Referer': process.env.URL || 'https://cleaningpro.uz',
      'X-Title': 'Prime Standard & Co',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages,
      max_tokens: 400,
      temperature: 0.4,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    // eslint-disable-next-line no-console
    console.error('OpenRouter error', res.status, errText)
    return serverError("AI yordamchidan javob olinmadi. Birozdan so'ng qayta urinib ko'ring.")
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const reply = data.choices?.[0]?.message?.content?.trim()
  if (!reply) return serverError("AI yordamchidan javob olinmadi. Birozdan so'ng qayta urinib ko'ring.")

  return json(200, { reply })
}

export { handler }
