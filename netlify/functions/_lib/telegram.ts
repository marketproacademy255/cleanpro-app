/**
 * Sends a message to the Prime Standard & Co admin Telegram bot/chat. Fails silently
 * (just logs) so a Telegram outage never blocks a booking or payment from
 * going through.
 *
 * Set in Netlify dashboard only (never VITE_-prefixed, this is a secret):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    // eslint-disable-next-line no-console
    console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID sozlanmagan, xabar yuborilmadi.')
    return
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('Telegram sendMessage failed', res.status, await res.text())
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Telegram sendMessage error', err)
  }
}

/**
 * Sends a message via the separate "auth" Telegram bot.
 */
export async function sendTelegramDirectMessage(chatId: string | number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_AUTH_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    // eslint-disable-next-line no-console
    console.error('TELEGRAM_AUTH_BOT_TOKEN / TELEGRAM_BOT_TOKEN sozlanmagan, xabar yuborilmadi.')
    return false
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('Telegram auth-bot sendMessage failed', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Telegram auth-bot sendMessage error', err)
    return false
  }
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function formatBookingCreatedMessage(params: {
  serviceName: string
  contactName: string
  contactPhone: string
  address: string
  city: string
  date: string
  time: string
  totalAmountUZS: number
  bookingId: string
  apartment?: string
  floor?: string
  entrance?: string
  intercom?: string
  landmark?: string
  lat?: number
  lng?: number
  paymentMethod?: string
  repairNotes?: string
  repairPhotoCount?: number
}): string {
  const amount = new Intl.NumberFormat('uz-UZ').format(Math.round(params.totalAmountUZS))
  const lines = [
    '🆕 <b>YANGI BUYURTMA</b>',
    `🆔 <b>ID:</b> <code>${esc(params.bookingId)}</code>`,
    `🧹 <b>Xizmat:</b> ${esc(params.serviceName)}`,
    `👤 <b>Mijoz:</b> ${esc(params.contactName)} (${esc(params.contactPhone)})`,
    `📍 <b>Manzil:</b> ${esc(params.address)}, ${esc(params.city)}`,
  ]

  // Detailed building details
  const buildingDetails: string[] = []
  if (params.apartment) buildingDetails.push(`Xonadon/Ofis: ${esc(params.apartment)}`)
  if (params.floor) buildingDetails.push(`Qavat: ${esc(params.floor)}`)
  if (params.entrance) buildingDetails.push(`Podyezd: ${esc(params.entrance)}`)
  if (params.intercom) buildingDetails.push(`Domofon: ${esc(params.intercom)}`)

  if (buildingDetails.length > 0) {
    lines.push(`🏢 <b>Bino ma'lumotlari:</b> ${buildingDetails.join(', ')}`)
  }

  if (params.landmark) {
    lines.push(`🚩 <b>Mo'ljal:</b> ${esc(params.landmark)}`)
  }

  // Map location link
  if (typeof params.lat === 'number' && typeof params.lng === 'number' && (params.lat !== 0 || params.lng !== 0)) {
    const yandexMapUrl = `https://yandex.uz/maps/?pt=${params.lng},${params.lat}&z=17&l=map`
    lines.push(`🗺️ <b>Xaritada joylashuv:</b> <a href="${yandexMapUrl}">Yandex Maps-da ko'rish</a>`)
  }

  lines.push(`📅 <b>Sana va vaqt:</b> ${esc(params.date)} soat ${esc(params.time)}`)
  lines.push(`💰 <b>Summa:</b> <b>${amount} so'm</b>`)

  if (params.paymentMethod) {
    lines.push(`💳 <b>To'lov usuli:</b> ${esc(params.paymentMethod)}`)
  }

  if (params.repairNotes) {
    lines.push(`📝 <b>Loyiha tavsifi:</b> ${esc(params.repairNotes)}`)
  }
  if (params.repairPhotoCount) {
    lines.push(`📷 <b>Loyiha rasmlari:</b> ${params.repairPhotoCount} ta (admin panelda ko'ring)`)
  }

  return lines.join('\n')
}

export function formatReferralRewardMessage(params: {
  referrerUid: string
  rewardUZS: number
  bookingId: string
}): string {
  const amount = new Intl.NumberFormat('uz-UZ').format(Math.round(params.rewardUZS))
  return [
    '🎁 <b>Referral mukofoti tayyor</b>',
    `Taklif qilingan mijozning buyurtmasi (ID: ${esc(params.bookingId)}) bajarildi.`,
    `Taklif qiluvchi (uid: ${esc(params.referrerUid)}) hisobiga ${amount} so'm kredit yozildi.`,
  ].join('\n')
}

export function formatReceiptUploadedMessage(params: {
  contactName: string
  contactPhone: string
  address: string
  amountUZS: number
  bookingId: string
  receiptUrl: string
}): string {
  const amount = new Intl.NumberFormat('uz-UZ').format(Math.round(params.amountUZS))
  const receiptLine = params.receiptUrl.startsWith('data:')
    ? "Chek: admin panel -> Buyurtmalar jadvalida ko'ring"
    : `Chek: ${esc(params.receiptUrl)}`
  return [
    "🧾 <b>TO'LOV CHEKI YUKLANDI</b>",
    `👤 <b>Mijoz:</b> ${esc(params.contactName)} (${esc(params.contactPhone)})`,
    `📍 <b>Manzil:</b> ${esc(params.address)}`,
    `💰 <b>Summa:</b> ${amount} so'm`,
    `🆔 <b>Buyurtma ID:</b> ${esc(params.bookingId)}`,
    receiptLine,
    'Admin panelda tekshirib tasdiqlang.',
  ].join('\n')
}

export function formatContactMessage(params: {
  name: string
  contact: string
  message: string
}): string {
  return [
    '✉️ <b>Yangi xabar (Aloqa sahifasi)</b>',
    `Ism: ${esc(params.name)}`,
    `Aloqa: ${esc(params.contact)}`,
    `Xabar: ${esc(params.message)}`,
  ].join('\n')
}

export function formatPaymentConfirmedMessage(params: {
  provider: 'payme' | 'click' | 'cash'
  contactName: string
  contactPhone: string
  address: string
  amountUZS: number
  bookingId: string
  serviceName?: string
  date?: string
  time?: string
  apartment?: string
  floor?: string
  entrance?: string
  intercom?: string
  landmark?: string
  lat?: number
  lng?: number
}): string {
  const amount = new Intl.NumberFormat('uz-UZ').format(Math.round(params.amountUZS))
  const providerTitle = params.provider === 'payme' ? 'Payme' : params.provider === 'click' ? 'Click' : 'Naqd pul'

  const lines = [
    "✅ <b>TO'LOV MUVAFFAQIYATLI QABUL QILINDI</b>",
    `💳 <b>To'lov tizimi:</b> ${providerTitle}`,
    `🆔 <b>Buyurtma ID:</b> <code>${esc(params.bookingId)}</code>`,
    `👤 <b>Mijoz:</b> ${esc(params.contactName)} (${esc(params.contactPhone)})`,
    `📍 <b>Manzil:</b> ${esc(params.address)}`,
  ]

  const buildingDetails: string[] = []
  if (params.apartment) buildingDetails.push(`Xonadon: ${esc(params.apartment)}`)
  if (params.floor) buildingDetails.push(`Qavat: ${esc(params.floor)}`)
  if (params.entrance) buildingDetails.push(`Podyezd: ${esc(params.entrance)}`)
  if (params.intercom) buildingDetails.push(`Domofon: ${esc(params.intercom)}`)

  if (buildingDetails.length > 0) {
    lines.push(`🏢 <b>Bino:</b> ${buildingDetails.join(', ')}`)
  }

  if (params.landmark) {
    lines.push(`🚩 <b>Mo'ljal:</b> ${esc(params.landmark)}`)
  }

  if (typeof params.lat === 'number' && typeof params.lng === 'number' && (params.lat !== 0 || params.lng !== 0)) {
    const yandexMapUrl = `https://yandex.uz/maps/?pt=${params.lng},${params.lat}&z=17&l=map`
    lines.push(`🗺️ <b>Xarita:</b> <a href="${yandexMapUrl}">Yandex Maps-da ochish</a>`)
  }

  if (params.serviceName) {
    lines.push(`🧹 <b>Xizmat:</b> ${esc(params.serviceName)}`)
  }
  if (params.date && params.time) {
    lines.push(`📅 <b>Vaqt:</b> ${esc(params.date)} ${esc(params.time)}`)
  }

  lines.push(`💰 <b>To'langan summa:</b> <b>${amount} so'm</b>`)

  return lines.join('\n')
}
