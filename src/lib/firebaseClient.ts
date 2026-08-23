import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

/**
 * Firebase config values are meant to be public (they identify your
 * Firebase project to the browser, they are not a secret like an API
 * key for a server). Real security comes from Firebase Auth itself plus
 * the backend token verification in netlify/functions/*, not from hiding
 * these values. We still load them from env vars (instead of hardcoding)
 * so dev/staging/prod can point at different Firebase projects and so
 * nothing is committed to git.
 *
 * Set these in Netlify: Site settings -> Environment variables (and in a
 * local .env file for `npm run dev`, see .env.example).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * True only when the app has enough config to actually talk to Firebase.
 * The rest of the app treats `auth` as possibly null and degrades
 * gracefully (no crash, just "kirish" disabled) so that pages that don't
 * need auth or backend data - Home, About, Contact, Services listing,
 * Booking form - still render normally even with no .env / no backend
 * configured (e.g. a fresh local checkout or a broken deploy).
 */
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

if (!firebaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    "Firebase muhit o'zgaruvchilari topilmadi. .env faylida VITE_FIREBASE_* qiymatlarini tekshiring. " +
      "Sahifalar baribir ochiladi, lekin kirish/ro'yxatdan o'tish va ma'lumotlar ishlamaydi.",
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null

try {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  auth = getAuth(app)
} catch (err) {
  // Never let a bad/missing Firebase config take down the whole app.
  // eslint-disable-next-line no-console
  console.error('Firebase ishga tushmadi:', err)
}

export { app, auth }
