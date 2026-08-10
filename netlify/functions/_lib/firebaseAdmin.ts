import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { HandlerEvent } from '@netlify/functions'

/**
 * Server-side Firebase Admin SDK setup (Auth + Firestore). Reads the
 * service account from three separate env vars (never a VITE_-prefixed
 * one, so it can never end up in the client bundle). Set these in
 * Netlify's dashboard only:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (paste with literal \n, we unescape below)
 * Get these from Firebase Console -> Project settings -> Service accounts
 * -> Generate new private key.
 *
 * The Admin SDK bypasses firestore.rules entirely - every function that
 * uses it MUST verify the caller's ID token (see auth.ts) and enforce
 * ownership/admin checks itself.
 */
function ensureInitialized() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY muhit o\'zgaruvchilari topilmadi (Netlify env).',
      )
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }
}

export function getDb() {
  ensureInitialized()
  return getFirestore()
}

/**
 * Verifies the Firebase ID token sent in the Authorization: Bearer header.
 * Returns the decoded token (contains uid, email, ...) or null if missing
 * / invalid / expired.
 */
export async function verifyFirebaseToken(event: HandlerEvent): Promise<DecodedIdToken | null> {
  ensureInitialized()
  const authHeader = event.headers.authorization ?? event.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const idToken = authHeader.slice('Bearer '.length)
  try {
    return await getAuth().verifyIdToken(idToken)
  } catch {
    return null
  }
}
