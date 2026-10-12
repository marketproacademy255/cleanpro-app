import { randomBytes } from 'node:crypto'
import type { Firestore } from 'firebase-admin/firestore'

/**
 * Telegram phone-verification protocol. Shared by the Netlify webhook
 * (telegram-webhook.ts) and mirrored 1:1 in the two standalone bots
 * (telegram-auth-bot/bot.js, telegram-bot-python/bot.py) - if you change
 * the document shape or the checks here, change them there too.
 *
 * phoneVerifications/{uid}:
 *   uid, phone        - the logged-in site user and the phone they typed
 *   nonce             - random, sent to the bot as the /start deep-link payload
 *   status            - 'pending' | 'verified'
 *   chat_id           - set when the user opens the bot via the deep link
 *   created_at, expires_at, updated_at (ISO strings)
 *
 * Flow:
 *   1. Site (authenticated) -> phone-verify-request -> doc above + bot link
 *      https://t.me/<bot>?start=<nonce>
 *   2. Bot "/start <nonce>" -> binds chat_id to the doc
 *   3. Bot receives the user's OWN contact (contact.user_id === from.id)
 *      -> phone must equal doc.phone and not be verified on another account
 *      -> profiles/{uid}.phone_verified = true
 *   4. Site polls phone-verify-status (authenticated) until 'verified'.
 *
 * Nothing secret (passwords, auth tokens) is ever stored or returned - the
 * user is already signed in on the site; the bot only flips a flag on
 * THEIR profile.
 */

export const VERIFICATION_TTL_MS = 15 * 60 * 1000

export interface PhoneVerificationDoc {
  uid: string
  phone: string
  nonce: string
  status: 'pending' | 'verified'
  chat_id?: number | null
  created_at: string
  expires_at: string
  updated_at: string
}

export function newNonce(): string {
  // 32 hex chars - fits Telegram's 64-char [A-Za-z0-9_-] /start payload limit.
  return randomBytes(16).toString('hex')
}

export function isExpired(doc: Pick<PhoneVerificationDoc, 'expires_at'>): boolean {
  return new Date(doc.expires_at).getTime() < Date.now()
}

/** Returns the uid of ANOTHER account that already has this phone verified, if any. */
export async function findOtherVerifiedOwner(db: Firestore, phone: string, uid: string): Promise<string | null> {
  const snap = await db.collection('profiles').where('phone', '==', phone).get()
  const other = snap.docs.find((d) => d.id !== uid && d.data().phone_verified === true)
  return other ? other.id : null
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export type BindResult = 'bound' | 'not_found' | 'expired' | 'already_verified'

/** Bot side, step 2: "/start <nonce>". */
export async function bindChatToNonce(db: Firestore, nonce: string, chatId: number): Promise<BindResult> {
  const snap = await db.collection('phoneVerifications').where('nonce', '==', nonce).limit(1).get()
  if (snap.empty) return 'not_found'
  const doc = snap.docs[0]
  const data = doc.data() as PhoneVerificationDoc
  if (data.status === 'verified') return 'already_verified'
  if (isExpired(data)) return 'expired'
  await doc.ref.update({ chat_id: chatId, updated_at: new Date().toISOString() })
  return 'bound'
}

export type VerifyResult =
  | { kind: 'verified'; phone: string }
  | { kind: 'no_request' }
  | { kind: 'expired' }
  | { kind: 'phone_mismatch'; expected: string; got: string }
  | { kind: 'taken' }

/** Bot side, step 3: the user shared their own contact in this chat. */
export async function verifyContact(db: Firestore, chatId: number, phone: string): Promise<VerifyResult> {
  const snap = await db.collection('phoneVerifications').where('chat_id', '==', chatId).get()
  const pending = snap.docs
    .map((d) => ({ ref: d.ref, data: d.data() as PhoneVerificationDoc }))
    .filter((d) => d.data.status === 'pending')
    .sort((a, b) => b.data.created_at.localeCompare(a.data.created_at))[0]

  if (!pending) return { kind: 'no_request' }
  if (isExpired(pending.data)) return { kind: 'expired' }
  if (pending.data.phone !== phone) return { kind: 'phone_mismatch', expected: pending.data.phone, got: phone }

  const { uid } = pending.data
  if (await findOtherVerifiedOwner(db, phone, uid)) return { kind: 'taken' }

  const now = new Date().toISOString()
  const batch = db.batch()
  batch.set(
    db.collection('profiles').doc(uid),
    { phone, phone_verified: true, phone_verified_at: now },
    { merge: true },
  )
  batch.update(pending.ref, { status: 'verified', updated_at: now })
  await batch.commit()
  return { kind: 'verified', phone }
}

/** Bot reply text for each verifyContact() outcome (Telegram HTML). */
export function verifyResultMessage(r: VerifyResult, siteUrl: string): string {
  switch (r.kind) {
    case 'verified':
      return (
        '✅ <b>Telefon raqamingiz tasdiqlandi!</b>\n\n' +
        `Telefon: <code>${escapeHtml(r.phone)}</code>\n\n` +
        'Saytga qayting - sahifa avtomatik yangilanadi.'
      )
    case 'no_request':
      return (
        '⚠️ Bu chat uchun faol tasdiqlash so\'rovi topilmadi.\n\n' +
        `Saytga kiring (${escapeHtml(siteUrl)}), <b>"Tasdiqlash"</b> tugmasini bosing va ` +
        'chiqqan <b>"Telegram botni ochish"</b> havolasi orqali qayta keling.'
      )
    case 'expired':
      return "⌛ Tasdiqlash havolasining muddati tugagan. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing."
    case 'phone_mismatch':
      return (
        '❌ Telegram raqamingiz saytda kiritilgan raqamga mos kelmadi.\n\n' +
        `Saytda: <code>${escapeHtml(r.expected)}</code>\n` +
        `Telegram: <code>${escapeHtml(r.got)}</code>\n\n` +
        'Saytda Telegram hisobingizga ulangan raqamni kiriting va qaytadan urinib ko\'ring.'
      )
    case 'taken':
      return "❌ Bu raqam boshqa akkauntda allaqachon tasdiqlangan. Agar bu xato bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling."
  }
}

export function bindResultMessage(r: BindResult): string {
  switch (r) {
    case 'bound':
      return "Raqamingizni tasdiqlash uchun pastdagi 📱 <b>Raqamni yuborish</b> tugmasini bosing."
    case 'already_verified':
      return '✅ Bu so\'rov allaqachon tasdiqlangan. Saytga qaytishingiz mumkin.'
    case 'expired':
      return "⌛ Havolaning muddati tugagan. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing."
    case 'not_found':
      return "⚠️ Havola yaroqsiz. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing."
  }
}
