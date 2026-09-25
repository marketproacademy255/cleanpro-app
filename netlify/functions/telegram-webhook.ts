import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import bcrypt from 'bcryptjs'
import { getAdminAuth, getDb } from './_lib/firebaseAdmin'
import { normalizeUzPhone } from './_lib/phone'
import { json, badRequest, serverError } from './_lib/respond'

const BOT_TOKEN = process.env.TELEGRAM_AUTH_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || ''

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

  if (!BOT_TOKEN) {
    return serverError('TELEGRAM_AUTH_BOT_TOKEN / TELEGRAM_BOT_TOKEN not configured.')
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
    return json(200, { ok: false, error: err instanceof Error ? err.message : 'Processing error' })
  }
}

async function processUpdate(update: TelegramUpdate): Promise<void> {
  const db = getDb()
  const message = update.message

  if (!message || !message.from) return

  const chatId = message.chat.id
  const userId = message.from.id
  const text = (message.text ?? '').trim()

  const sessionRef = db.collection('telegramAuthSessions').doc(String(chatId))
  const sessionSnap = await sessionRef.get()
  const sessionData = sessionSnap.exists ? sessionSnap.data() : null

  // 1. /start command
  if (text === '/start' || text.startsWith('/start ')) {
    await sessionRef.set({
      chat_id: chatId,
      user_id: userId,
      step: 'AWAITING_CONTACT',
      updated_at: new Date().toISOString(),
    })

    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text:
        "Assalomu alaykum! CleanPro'ning rasmiy ro'yxatdan o'tish botiga xush kelibsiz.\n\n" +
        "Boshlash uchun pastdagi 📱 <b>Raqamni yuborish</b> tugmasini bosing.",
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
    return
  }

  // 2. /cancel command
  if (text === '/cancel') {
    await sessionRef.delete()
    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text: 'Jarayon bekor qilindi. Qaytadan boshlash uchun /start buyrug‘ini bosing.',
      reply_markup: { remove_keyboard: true },
    })
    return
  }

  // 3. Contact message
  if (message.contact) {
    const contact = message.contact

    if (contact.user_id && contact.user_id !== userId) {
      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text: 'Faqat o‘zingizning telefon raqamingizni yuborishingiz mumkin.',
      })
      return
    }

    const phone = normalizeUzPhone(contact.phone_number)
    if (!phone) {
      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text: "Telefon raqamni aniqlab bo'lmadi. Iltimos, /start bosib qayta urinib ko'ring.",
      })
      return
    }

    // 3a. Check if there is a pending website registration phone verification request
    const verifyDocRef = db.collection('phoneVerifications').doc(phone)
    const verifySnap = await verifyDocRef.get()

    if (verifySnap.exists) {
      const vData = verifySnap.data()!
      if (vData.status === 'pending') {
        let uid = vData.uid || db.collection('profiles').doc().id
        let customToken = ''

        try {
          const adminAuth = getAdminAuth()
          customToken = await adminAuth.createCustomToken(uid)
        } catch {
          // Ignore if admin auth is not fully configured
        }

        const now = new Date().toISOString()
        const batch = db.batch()

        batch.set(
          db.collection('profiles').doc(uid),
          {
            role: 'customer',
            full_name: vData.full_name || message.from.first_name || 'Foydalanuvchi',
            phone,
            email: vData.email || null,
            phone_verified: true,
            created_at: now,
          },
          { merge: true },
        )

        batch.update(verifyDocRef, {
          status: 'verified',
          uid,
          custom_token: customToken,
          updated_at: now,
        })

        await batch.commit()

        await sendTelegramApi('sendMessage', {
          chat_id: chatId,
          text:
            "✅ <b>Telefon raqamingiz muvaffaqiyatli tasdiqlandi!</b>\n\n" +
            `Ism: <b>${vData.full_name || message.from.first_name}</b>\n` +
            `Telefon: <code>${phone}</code>\n\n` +
            "Saytga qaytishingiz mumkin — akkauntingiz avtomatik tasdiqlandi!",
          parse_mode: 'HTML',
          reply_markup: { remove_keyboard: true },
        })

        await sessionRef.delete().catch(() => null)
        return
      }
    }

    const existingAuth = await db.collection('telegramAuth').doc(phone).get()
    if (existingAuth.exists) {
      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text:
          "Bu raqam allaqachon ro'yxatdan o'tgan. Saytda <b>Kirish -> Telegram</b> bo'limidan shu raqam va parolingiz bilan kiring.",
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true },
      })
      await sessionRef.delete()
      return
    }

    await sessionRef.set({
      chat_id: chatId,
      user_id: userId,
      phone,
      step: 'AWAITING_NAME',
      updated_at: new Date().toISOString(),
    })

    const suggestedName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ')

    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text: `Rahmat! Endi to'liq ism-familiyangizni yozing ${suggestedName ? `(masalan: ${suggestedName})` : ''}:`,
      reply_markup: { remove_keyboard: true },
    })
    return
  }

  // 4. Handle text steps (Name or Password)
  if (sessionData && text) {
    if (sessionData.step === 'AWAITING_NAME') {
      if (text.length < 2 || text.length > 100) {
        await sendTelegramApi('sendMessage', {
          chat_id: chatId,
          text: 'Ism juda qisqa yoki uzun. Qaytadan kiriting:',
        })
        return
      }

      await sessionRef.update({
        full_name: text,
        step: 'AWAITING_PASSWORD',
        updated_at: new Date().toISOString(),
      })

      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text:
          "Endi saytga kirish uchun parol o'ylab toping (kamida 6 ta belgi):\n" +
          "⚠️ <i>Xavfsizlik uchun bu xabaringiz o'chirib tashlanadi.</i>",
        parse_mode: 'HTML',
      })
      return
    }

    if (sessionData.step === 'AWAITING_PASSWORD') {
      // Attempt to delete password message for privacy
      await sendTelegramApi('deleteMessage', {
        chat_id: chatId,
        message_id: message.message_id,
      })

      if (text.length < 6 || text.length > 200) {
        await sendTelegramApi('sendMessage', {
          chat_id: chatId,
          text: "Parol kamida 6 ta belgidan iborat bo'lishi kerak. Qaytadan yozing:",
        })
        return
      }

      const phone = sessionData.phone
      const fullName = sessionData.full_name

      if (!phone || !fullName) {
        await sendTelegramApi('sendMessage', {
          chat_id: chatId,
          text: 'Xatolik yuz berdi. Iltimos /start bosib qaytadan boshlang.',
        })
        await sessionRef.delete()
        return
      }

      const passwordHash = await bcrypt.hash(text, 10)
      const now = new Date().toISOString()
      const uid = db.collection('profiles').doc().id

      const batch = db.batch()
      batch.set(db.collection('profiles').doc(uid), {
        role: 'customer',
        full_name: fullName,
        phone,
        email: null,
        created_at: now,
      })
      batch.set(db.collection('telegramAuth').doc(phone), {
        uid,
        chat_id: chatId,
        password_hash: passwordHash,
        full_name: fullName,
        created_at: now,
      })
      await batch.commit()
      await sessionRef.delete()

      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text:
          "✅ <b>Ro'yxatdan muvaffaqiyatli o'tdingiz!</b>\n\n" +
          `Telefon: <code>${phone}</code>\n\n` +
          "Endi saytda <b>Kirish -> Telegram</b> bo'limidan shu raqam va parolingiz bilan kiring - tasdiqlash kodi shu botga yuboriladi.",
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true },
      })
      return
    }
  }

  // Fallback
  await sendTelegramApi('sendMessage', {
    chat_id: chatId,
    text: "Boshlash uchun /start buyrug'ini bosing.",
  })
}

export { handler }
