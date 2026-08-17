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
// Foydalanuvchining o'zi aytganidek, token hozircha to'g'ridan-to'g'ri kodga
// ham qo'shib qo'yildi (ishga tushirish uchun .env shart emas) - lekin
// BOT_TOKEN muhit o'zgaruvchisi berilsa, o'sha ustunlik qiladi. Demo bosqichi
// tugagach buni environment-only qilib, quyidagi qatordan tokenni olib
// tashlash tavsiya etiladi.
const BOT_TOKEN = process.env.BOT_TOKEN || '8862054310:AAEfsiYWVuZ8mCsqj-07XXZxYf2VfPc4mIw'

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

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
        "Bu raqam allaqachon ro'yxatdan o'tgan. Saytda Kirish -> Telegram bo'limidan " +
          'shu raqam va parolingiz bilan kiring.',
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
bot.use(stage.middleware())

function signupKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback("📝 Ro'yxatdan o'tish", 'start_signup')]])
}

bot.start(async (ctx) => {
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
