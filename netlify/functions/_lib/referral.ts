import type { Firestore } from 'firebase-admin/firestore'

/**
 * Fixed credit (in so'm) added to a referrer's `profiles/{uid}.referral_credits_uzs`
 * ledger once their referred friend's first booking is marked 'completed'
 * (see bookings.ts PATCH handler). There's no wallet/auto-payout on this
 * project, so this is a running total the admin applies manually to a
 * future invoice or payout - same limitation documented for the
 * Click balance-to-card discussion.
 */
export const REFERRAL_REWARD_UZS = 50_000

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I - avoids confusion when read aloud/typed
const CODE_LENGTH = 6

function randomCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return out
}

/**
 * Returns this user's referral code, generating and persisting one (on
 * both `profiles/{uid}.referral_code` and a `referrals/{code}` lookup doc)
 * the first time it's needed. Retries a handful of times on the
 * astronomically unlikely chance of a collision (32^6 ≈ 1.07 billion
 * combinations).
 */
export async function ensureReferralCode(db: Firestore, uid: string, existingCode?: string | null): Promise<string> {
  if (existingCode) return existingCode

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const codeRef = db.collection('referrals').doc(code)
    const codeSnap = await codeRef.get()
    if (codeSnap.exists) continue

    await codeRef.set({ owner_uid: uid, created_at: new Date().toISOString() })
    await db.collection('profiles').doc(uid).set({ referral_code: code }, { merge: true })
    return code
  }

  throw new Error("Referral kodi yaratib bo'lmadi, qaytadan urinib ko'ring.")
}
