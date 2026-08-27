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
 * Sends a message via the separate "auth" Telegram bot (the one customers
 * register through - see the standalone Python bot). Distinct from
 * notifyTelegram() above, which posts to the fixed admin chat using the
 * business's own notification bot. Set TELEGRAM_AUTH_BOT_TOKEN in Netlify
 * env vars (never VITE_-prefixed).
 */
export async function sendTelegramDirectMessage(chatId: string | number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_AUTH_BOT_TOKEN
  if (!token) {
    // eslint-disable-next-line no-console
    console.error('TELEGRAM_AUTH_BOT_TOKEN sozlanmagan, login kodi yuborilmadi.')
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
  repairNotes?: string
  repairPhotoCount?: number
}): string {
  const amount = new Intl.NumberFormat('uz-UZ').format(Math.round(params.totalAmountUZS))
  const lines = [
    '🆕 <b>Yangi buyurtma</b>',
    `Xizmat: ${esc(params.serviceName)}`,
    `Mijoz: ${esc(params.contactName)} (${esc(params.contactPhone)})`,
    `Manzil: ${esc(params.address)}, ${esc(params.city)}`,
    `Sana: ${esc(params.date)} ${esc(params.time)}`,
    `Summa: ${amount} so'm`,
    "To'lov: kutilmoqda",
    `ID: ${esc(params.bookingId)}`,
  ]
  // Repair/renovation bookings can include a project description + up to 2
  // photos (data: URLs - too long for a Telegram message, see
  // formatReceiptUploadedMessage's same tradeoff) - point the admin at the
  // panel to view them and adjust the flat estimate into a real quote.
  if (params.repairNotes) {
    lines.push(`Loyiha tavsifi: ${esc(params.repairNotes)}`)
  }
  if (params.repairPhotoCount) {
    lines.push(`Loyiha rasmlari: ${params.repairPhotoCount} ta (admin panelda ko'ring, narxni moslashtiring)`)
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
    "🎁 <b>Referral mukofoti tayyor</b>",
    `Taklif qilingan mijozning buyurtmasi (ID: ${esc(params.bookingId)}) bajarildi.`,
    `Taklif qiluvchi (uid: ${esc(params.referrerUid)}) hisobiga ${amount} so'm kredit yozildi.`,
    "Eslatma: bu faqat hisob-kitob yozuvi - to'lovni/chegirmani mijozga qo'lda qo'llang (avtomatik pul o'tkazish yo'q).",
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
  // Receipts are stored as data: URLs (no Storage bucket on this project),
  // which can be hundreds of KB - far too long for a Telegram message, so
  // we point admins at the admin panel instead of inlining the link.
  const receiptLine = params.receiptUrl.startsWith('data:')
    ? "Chek: admin panel -> Buyurtmalar jadvalida ko'ring"
    : `Chek: ${esc(params.receiptUrl)}`
  return [
    "🧾 <b>To'lov cheki yuklandi</b>",
    `Mijoz: ${esc(params.contactName)} (${esc(params.contactPhone)})`,
    `Manzil: ${esc(params.address)}`,
    `Summa: ${amount} so'm`,
    `Buyurtma ID: ${esc(params.bookingId)}`,
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
  provider: 'payme' | 'click'
  contactName: string
  contactPhone: string
  address: string
  amountUZS: number
  bookingId: string
}): string {
  const amount = new Intl.NumberFormat('uz-UZ').format(Math.round(params.amountUZS))
  return [
    "✅ <b>To'lov qabul qilindi</b>",
    `Provayder: ${params.provider === 'payme' ? 'Payme' : 'Click'}`,
    `Mijoz: ${esc(params.contactName)} (${esc(params.contactPhone)})`,
    `Manzil: ${esc(params.address)}`,
    `Summa: ${amount} so'm`,
    `Buyurtma ID: ${esc(params.bookingId)}`,
  ].join('\n')
}
