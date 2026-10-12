// One-time cleanup after the phone-verification rework (see
// netlify/functions/_lib/phoneVerification.ts). Dry run by default - prints
// what it would do. Re-run with --apply to actually write.
//
//   node scripts/migrate-phone-verification.mjs           # dry run
//   node scripts/migrate-phone-verification.mjs --apply
//
// 1. Deletes old-format phoneVerifications docs (keyed by phone, holding
//    the user's PLAINTEXT password in `password_raw` and a Firebase custom
//    token in `custom_token`).
// 2. Marks profiles of Telegram-bot-registered users (telegramAuth/{phone})
//    as phone_verified - the bot already checked they own that number.
// 3. Clears phone_verified on profiles the old flow created under a random
//    uid that no real (email/Google) login belongs to - otherwise those
//    orphans would block the real owner from verifying the same number.
//
// Needs FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
// in .env, same as seed-firestore.mjs.

import 'dotenv/config'
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
if (!projectId || !clientEmail || !privateKey) {
  console.error("FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY topilmadi. .env faylida to'ldiring.")
  process.exit(1)
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
const db = getFirestore()
const auth = getAuth()
const now = new Date().toISOString()

async function write(label, fn) {
  console.log(`${APPLY ? '[apply]' : '[dry-run]'} ${label}`)
  if (APPLY) await fn()
}

// 1. Legacy phoneVerifications docs
const verifications = await db.collection('phoneVerifications').get()
for (const doc of verifications.docs) {
  const d = doc.data()
  if (doc.id.startsWith('+') || 'password_raw' in d || 'custom_token' in d) {
    await write(`delete phoneVerifications/${doc.id}`, () => doc.ref.delete())
  }
}

// 2. Telegram-bot-registered users
const telegramUids = new Set()
const telegramAuth = await db.collection('telegramAuth').get()
for (const doc of telegramAuth.docs) {
  const { uid } = doc.data()
  if (!uid) continue
  telegramUids.add(uid)
  const profile = await db.collection('profiles').doc(uid).get()
  if (!profile.exists || profile.data().phone_verified === true) continue
  await write(`verify profiles/${uid} (telegramAuth ${doc.id})`, () =>
    profile.ref.set({ phone: doc.id, phone_verified: true, phone_verified_at: now }, { merge: true }),
  )
}

// 3. Orphan "verified" profiles from the old flow
const verified = await db.collection('profiles').where('phone_verified', '==', true).get()
for (const doc of verified.docs) {
  if (telegramUids.has(doc.id) || doc.data().role === 'admin') continue
  let orphan = false
  try {
    const user = await auth.getUser(doc.id)
    // Custom-token-only users (no email/Google provider) were minted by the
    // old flow and can't sign in again.
    orphan = user.providerData.length === 0
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err
    orphan = true
  }
  if (orphan) {
    await write(`unverify orphan profiles/${doc.id} (${doc.data().phone})`, () =>
      doc.ref.update({ phone_verified: false, phone_verified_at: FieldValue.delete() }),
    )
  }
}

console.log(APPLY ? 'Tayyor.' : "Dry run tugadi. Yozish uchun --apply bilan qayta ishga tushiring.")
