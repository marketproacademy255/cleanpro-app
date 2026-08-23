import { getFirestore, type Firestore } from 'firebase/firestore'
import { app } from './firebaseClient'

/**
 * Client-side Firestore instance. Only used for reading PUBLIC,
 * non-sensitive data directly from the browser: serviceTypes, addons,
 * cleaners (active ones only - see firestore.rules). Everything that
 * touches profiles/bookings/payments goes through the Netlify Functions
 * backend (netlify/functions/*, src/lib/api.ts) using the Firebase Admin
 * SDK server-side instead, which bypasses these rules entirely - see
 * firestore.rules for why those three collections deny all client access.
 *
 * `app` is null when Firebase isn't configured (no .env / missing
 * VITE_FIREBASE_* vars). getFirestore(null) would throw synchronously at
 * import time and crash the entire app (including pages that don't need
 * any backend data, like Home) - so we guard it here and let callers
 * (see publicData.ts) treat a missing db as "no data" instead of a crash.
 */
export const db: Firestore | null = app ? getFirestore(app) : null
