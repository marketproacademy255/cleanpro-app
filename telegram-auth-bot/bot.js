/**
 * CleanPro Telegram ro'yxatdan o'tish / kirish boti (Node.js / Telegraf).
 *
 * Bu alohida, mustaqil bot - CleanPro saytining asosiy loyihasidan (Netlify
 * Functions) alohida, o'z serveringizda ishga tushiriladi.
 *
 * Foydalanuvchi shu bot orqali telefon raqami + parol bilan CleanPro'da
 * "hisob" yaratadi (Firebase Firestore'ga yoziladi). Saytdagi login sahifasi
 * esa shu telefon+parolni tekshirib, tasdiqlash kodini xuddi shu (yoki bitta)
 * bot orqali yuboradi - buni netlify/functions/telegram-login-request.ts
 * bajaradi. Bu bot faqat RO'YXATDAN O'TISH oqimi uchun.
 *
 * Oqim:
 *   /start -> "Ro'yxatdan o'tish" tugmasi
 *          -> "Raqamni yuborish" (Telegram contact-share tugmasi)
 *          -> To'liq ism so'raladi
 *          -> Parol so'raladi (xabar darhol o'chiriladi)
 *          -> Firestore'ga yoziladi:
 *               profiles/{uid}        - saytdagi boshqa profillar bilan bir xil shaklda
 *               telegramAuth/{phone}  - login uchun: uid, chat_id, password_hash
 *
 * Ishga tushirish: README.md ga qarang.
 */

require('dotenv').config()

const { Telegraf, Scenes, session, Markup } = require('telegraf')
const bcrypt = require('bcryptjs')
const admin = require('firebase-admin')

// --------------------------------------------------------------------------
// Sozlamalar
// --------------------------------------------------------------------------
// Token FAQAT muhit o'zgaruvchisi orqali beriladi - kodga hech qachon
// yozmang (bu fayl git'da). '8862054310:...' bilan boshlanadigan eski token
// repozitoriyda oshkor bo'lgan - @BotFather orqali /revoke qiling.
const BOT_TOKEN = process.env.BOT_TOKEN

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN muhit o'zgaruvchisi topilmadi. .env.example ga qarang.")
  process.exit(1)
}

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error(
    'FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY muhit ' +
      "o'zgaruvchilari topilmadi. .env.example ga qarang.",
  )
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY,
  }),
})
const db = admin.firestore()

// --------------------------------------------------------------------------
// Telefon raqamni normallashtirish - bu netlify/functions/_lib/phone.ts
// dagi normalizeUzPhone() bilan AYNAN bir xil bo'lishi shart, aks holda
// saytdagi login funksiyasi botda yaratilgan hujjatni topa olmaydi.
// --------------------------------------------------------------------------
function normalizeUzPhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 9) return `+998${digits}`
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  return null
}

// --------------------------------------------------------------------------
// Saytdagi telefon raqamni tasdiqlash. netlify/functions/_lib/phoneVerification.ts
// dagi protokol bilan AYNAN bir xil - o'zgartirsangiz, u yerda ham o'zgartiring.
//   /start <nonce>  -> phoneVerifications/{uid} ga chat_id bog'lanadi
//   o'z kontakti    -> telefon mos bo'lsa profiles/{uid}.phone_verified = true
// --------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function isExpired(data) {
  return new Date(data.expires_at).getTime() < Date.now()
}

async function findPendingVerification(chatId) {
  const snap = await db.collection('phoneVerifications').where('chat_id', '==', chatId).get()
  return snap.docs
    .filter((d) => d.data().status === 'pending')
    .sort((a, b) => b.data().created_at.localeCompare(a.data().created_at))[0]
}

async function bindChatToNonce(nonce, chatId) {
  const snap = await db.collection('phoneVerifications').where('nonce', '==', nonce).limit(1).get()
  if (snap.empty) return "⚠️ Havola yaroqsiz. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing."
  const data = snap.docs[0].data()
  if (data.status === 'verified') return "✅ Bu so'rov allaqachon tasdiqlangan. Saytga qaytishingiz mumkin."
  if (isExpired(data)) return "⌛ Havolaning muddati tugagan. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing."
  await snap.docs[0].ref.update({ chat_id: chatId, updated_at: new Date().toISOString() })
  return null
}

async function verifyContact(doc, phone) {
  const data = doc.data()
  if (isExpired(data)) {
    return "⌛ Tasdiqlash havolasining muddati tugagan. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing."
  }
  if (data.phone !== phone) {
    return (
      '❌ Telegram raqamingiz saytda kiritilgan raqamga mos kelmadi.\n\n' +
      `Saytda: <code>${escapeHtml(data.phone)}</code>\n` +
      `Telegram: <code>${escapeHtml(phone)}</code>\n\n` +
      "Saytda Telegram hisobingizga ulangan raqamni kiriting va qaytadan urinib ko'ring."
    )
  }
  const owners = await db.collection('profiles').where('phone', '==', phone).get()
  if (owners.docs.some((d) => d.id !== data.uid && d.data().phone_verified === true)) {
    return "❌ Bu raqam boshqa akkauntda allaqachon tasdiqlangan. Agar bu xato bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling."
  }

  const now = new Date().toISOString()
  const batch = db.batch()
  batch.set(
    db.collection('profiles').doc(data.uid),
    { phone, phone_verified: true, phone_verified_at: now },
    { merge: true },
  )
  batch.update(doc.ref, { status: 'verified', updated_at: now })
  await batch.commit()
  return (
    '✅ <b>Telefon raqamingiz tasdiqlandi!</b>\n\n' +
    `Telefon: <code>${escapeHtml(phone)}</code>\n\n` +
    'Saytga qayting - sahifa avtomatik yangilanadi.'
  )
}

// --------------------------------------------------------------------------
// Ro'yxatdan o'tish oqimi (Telegraf Wizard Scene)
// --------------------------------------------------------------------------
const contactKeyboard = Markup.keyboard([
  Markup.button.contactRequest('📱 Raqamni yuborish'),
])
  .resize()
  .oneTime()

const signupWizard = new Scenes.WizardScene(
  'signup',

  // 1-qadam: telefon raqamni so'rash
  async (ctx) => {
    await ctx.reply(
      'Telefon raqamingizni ulashish uchun pastdagi tugmani bosing.\n' +
        '(Faqat o‘zingizning raqamingizni yuborishingiz mumkin.)',
      contactKeyboard,
    )
    return ctx.wizard.next()
  },

  // 2-qadam: kontaktni qabul qilish
  async (ctx) => {
    const contact = ctx.message && ctx.message.contact
    if (!contact) {
      await ctx.reply('Iltimos, pastdagi 📱 Raqamni yuborish tugmasini bosing.', contactKeyboard)
      return // shu qadamda qolamiz
    }

    if (contact.user_id !== ctx.from.id) {
      await ctx.reply(
        "Faqat o'zingizning telefon raqamingizni yuborishingiz mumkin. " +
          'Iltimos, pastdagi tugma orqali qayta urinib ko‘ring.',
        contactKeyboard,
      )
      return
    }

    const phone = normalizeUzPhone(contact.phone_number)
    if (!phone) {
      await ctx.reply(
        "Telefon raqamni tanib bo'lmadi. Iltimos, /start bosib qaytadan urinib ko'ring.",
        Markup.removeKeyboard(),
      )
      return ctx.scene.leave()
    }

    const existing = await db.collection('telegramAuth').doc(phone).get()
    if (existing.exists) {
      await ctx.reply(
        "Bu raqam allaqachon ro'yxatdan o'tgan. Saytda Kirish bo'limidan shu raqam va parolingiz bilan kiring.",
        Markup.removeKeyboard(),
      )
      return ctx.scene.leave()
    }

    ctx.wizard.state.phone = phone
    await ctx.reply(
      "Rahmat! Endi to'liq ismingizni yozing (masalan: Aziz Karimov).",
      Markup.removeKeyboard(),
    )
    return ctx.wizard.next()
  },

  // 3-qadam: to'liq ismni qabul qilish
  async (ctx) => {
    const fullName = (ctx.message && ctx.message.text ? ctx.message.text : '').trim()
    if (fullName.length < 2 || fullName.length > 100) {
      await ctx.reply('Ism juda qisqa yoki uzun. Qaytadan kiriting.')
      return
    }

    ctx.wizard.state.fullName = fullName
    await ctx.reply(
      "Endi kirish uchun parol o'ylab toping (kamida 6 ta belgi).\n" +
        '⚠️ Xavfsizlik uchun bu xabaringiz yuborilgandan so‘ng darhol o‘chiriladi.',
    )
    return ctx.wizard.next()
  },

  // 4-qadam: parolni qabul qilish va Firestore'ga yozish
  async (ctx) => {
    const password = ctx.message && ctx.message.text ? ctx.message.text : ''
    const chatId = ctx.chat.id
    const messageId = ctx.message.message_id

    // Parolni suhbat tarixida qoldirmaslik uchun darhol o'chirishga urinamiz.
    try {
      await ctx.telegram.deleteMessage(chatId, messageId)
    } catch (err) {
      console.warn(`Parol xabarini o'chirib bo'lmadi (chat_id=${chatId})`, err.message)
    }

    if (password.length < 6 || password.length > 200) {
      await ctx.reply("Parol kamida 6 ta belgidan iborat bo'lishi kerak. Qaytadan yozing.")
      return
    }

    const { phone, fullName } = ctx.wizard.state
    if (!phone || !fullName) {
      await ctx.reply('Xatolik yuz berdi. Iltimos /start bosib qaytadan boshlang.')
      return ctx.scene.leave()
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()

    // Firebase Auth foydalanuvchisini oldindan yaratish shart emas -
    // createCustomToken(uid) har qanday noyob uid uchun ishlaydi, va
    // signInWithCustomToken chaqirilganda Firebase Auth uni o'zi yaratadi.
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

    await ctx.reply(
      "✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!\n\n" +
        `Telefon: ${phone}\n\n` +
        "Endi saytda Kirish -> Telegram bo'limidan shu raqam va parolingiz bilan " +
        'kiring - tasdiqlash kodi shu botga yuboriladi.',
      Markup.removeKeyboard(),
    )
    return ctx.scene.leave()
  },
)

signupWizard.command('cancel', async (ctx) => {
  await ctx.reply("Bekor qilindi. Qaytadan boshlash uchun /start bosing.", Markup.removeKeyboard())
  return ctx.scene.leave()
})

// --------------------------------------------------------------------------
// Bot
// --------------------------------------------------------------------------
const bot = new Telegraf(BOT_TOKEN)
const stage = new Scenes.Stage([signupWizard])

bot.use(session())

// Saytdan kelgan tasdiqlash so'rovi bo'lsa, kontakt wizard'dan OLDIN shu
// yerda qayta ishlanadi.
bot.on('contact', async (ctx, next) => {
  const pending = await findPendingVerification(ctx.chat.id)
  if (!pending) return next()

  const contact = ctx.message.contact
  if (contact.user_id !== ctx.from.id) {
    await ctx.reply("Faqat o'zingizning raqamingizni pastdagi tugma orqali yuborishingiz mumkin.", contactKeyboard)
    return
  }
  const phone = normalizeUzPhone(contact.phone_number)
  if (!phone) {
    await ctx.reply("Faqat O'zbekiston (+998) raqamlari qabul qilinadi.", Markup.removeKeyboard())
    return
  }
  const text = await verifyContact(pending, phone)
  if (ctx.scene && ctx.scene.current) await ctx.scene.leave()
  await ctx.reply(text, { parse_mode: 'HTML', ...Markup.removeKeyboard() })
})

bot.use(stage.middleware())

function signupKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback("📝 Ro'yxatdan o'tish", 'start_signup')]])
}

bot.start(async (ctx) => {
  const nonce = (ctx.payload || '').trim()
  if (nonce) {
    const error = await bindChatToNonce(nonce, ctx.chat.id)
    if (error) {
      await ctx.reply(error, { parse_mode: 'HTML', ...Markup.removeKeyboard() })
    } else {
      await ctx.reply('Raqamingizni tasdiqlash uchun pastdagi 📱 <b>Raqamni yuborish</b> tugmasini bosing.', {
        parse_mode: 'HTML',
        ...contactKeyboard,
      })
    }
    return
  }

  await ctx.reply(
    "Assalomu alaykum! Bu CleanPro'ning rasmiy ro'yxatdan o'tish boti.\n\n" +
      "Bu yerda telefon raqamingiz va parolingiz bilan hisob yaratasiz - keyin " +
      "saytda shu ma'lumotlar bilan kirishingiz mumkin bo'ladi (SMS shart emas, " +
      'tasdiqlash kodi shu botga yuboriladi).\n\n' +
      'Boshlash uchun pastdagi tugmani bosing.',
    signupKeyboard(),
  )
})

bot.action('start_signup', async (ctx) => {
  await ctx.answerCbQuery()
  return ctx.scene.enter('signup')
})

bot.command('cancel', async (ctx) => {
  await ctx.reply('Hozircha faol jarayon yo‘q. /start bosing.')
})

bot.on('message', async (ctx) => {
  await ctx.reply("Boshlash uchun /start buyrug'ini bosing.", signupKeyboard())
})

bot.catch((err, ctx) => {
  console.error(`Xatolik (update ${ctx.updateType}):`, err)
})

bot
  .launch()
  .then(() => console.log('CleanPro auth bot ishga tushdi.'))
  .catch((err) => {
    console.error('Botni ishga tushirib bo‘lmadi:', err)
    process.exit(1)
  })

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
