import { getFirestore } from 'firebase/firestore'
import { app } from './firebaseClient'

/**
 * Client-side Firestore instance. Only used for reading PUBLIC,
 * non-sensitive data directly from the browser: serviceTypes, addons,
 * cleaners (active ones only - see firestore.rules). Everything that
 * touches profiles/bookings/payments goes through the Netlify Functions
 * backend (netlify/functions/*, src/lib/api.ts) using the Firebase Admin
 * SDK server-side instead, which bypasses these rules entirely - see
 * firestore.rules for why those three collections deny all client access.
 */
export const db = getFirestore(app)
