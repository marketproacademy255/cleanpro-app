import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { bindChatToNonce, bindResultMessage, verifyContact, verifyResultMessage } from './_lib/phoneVerification'
import { json, badRequest, serverError } from './_lib/respond'
import { safeEqual } from './_lib/safeEqual'

const BOT_TOKEN = process.env.TELEGRAM_AUTH_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || ''
// Must match the secret_token passed to setWebhook:
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://prime-standard.uz/.netlify/functions/telegram-webhook&secret_token=<SECRET>"
// Telegram then sends it back in X-Telegram-Bot-Api-Secret-Token on every
// update. Without this check anyone could POST a forged "contact" update
// and verify an arbitrary phone number.
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''
const SITE_URL = process.env.URL || 'https://prime-standard.uz'

const CONTACT_KEYBOARD = {
  keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
}

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

interface TelegramContact {
  phone_number: string
  first_name?: string
  last_name?: string
  user_id?: number
}

interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: { id: number; type: string }
  text?: string
  contact?: TelegramContact
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: {
    id: string
    from: TelegramUser
    message?: TelegramMessage
    data?: string
  }
}

async function sendTelegramApi(method: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!BOT_TOKEN) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  if (!BOT_TOKEN || !WEBHOOK_SECRET) {
    return serverError('TELEGRAM_AUTH_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET not configured.')
  }

  const headerSecret = event.headers['x-telegram-bot-api-secret-token'] ?? ''
  if (!safeEqual(headerSecret, WEBHOOK_SECRET)) {
    return json(401, { error: 'Unauthorized' })
  }

  let update: TelegramUpdate
  try {
    update = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON payload.')
  }

  try {
    await processUpdate(update)
    return json(200, { ok: true })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Telegram webhook error:', err)
    return json(200, { ok: false })
  }
}

async function processUpdate(update: TelegramUpdate): Promise<void> {
  const db = getDb()
  const message = update.message

  if (!message || !message.from) return

  const chatId = message.chat.id
  const text = (message.text ?? '').trim()

  // 1. /start [nonce] - the site's "Telegram botni ochish" deep link carries
  //    the verification nonce as the payload.
  if (text === '/start' || text.startsWith('/start ')) {
    const nonce = text.slice('/start'.length).trim()
    if (!nonce) {
      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text:
          "Assalomu alaykum! Bu CleanPro'ning telefon raqamni tasdiqlash boti.\n\n" +
          `Saytda (${SITE_URL}) <b>"Tasdiqlash"</b> tugmasini bosing va chiqqan havola orqali shu yerga qayting.`,
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true },
      })
      return
    }

    const result = await bindChatToNonce(db, nonce, chatId)
    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text: bindResultMessage(result),
      parse_mode: 'HTML',
      reply_markup: result === 'bound' ? CONTACT_KEYBOARD : { remove_keyboard: true },
    })
    return
  }

  // 2. Contact message - must be the sender's OWN contact.
  if (message.contact) {
    if (message.contact.user_id !== message.from.id) {
      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text: "Faqat o'zingizning raqamingizni pastdagi tugma orqali yuborishingiz mumkin.",
        reply_markup: CONTACT_KEYBOARD,
      })
      return
    }

    const phone = normalizeUzPhone(message.contact.phone_number)
    if (!phone) {
      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text: "Faqat O'zbekiston (+998) raqamlari qabul qilinadi.",
        reply_markup: { remove_keyboard: true },
      })
      return
    }

    const result = await verifyContact(db, chatId, phone)
    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text: verifyResultMessage(result, SITE_URL),
      parse_mode: 'HTML',
      reply_markup: { remove_keyboard: true },
    })
    return
  }

  // Fallback
  await sendTelegramApi('sendMessage', {
    chat_id: chatId,
    text: `Raqamni tasdiqlash uchun saytda (${SITE_URL}) "Tasdiqlash" tugmasini bosing.`,
  })
}

export { handler }
