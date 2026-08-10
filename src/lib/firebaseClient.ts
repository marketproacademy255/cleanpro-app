import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

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

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // eslint-disable-next-line no-console
  console.error(
    "Firebase muhit o'zgaruvchilari topilmadi. .env faylida VITE_FIREBASE_* qiymatlarini tekshiring.",
  )
}

export const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)

export const auth = getAuth(app)
