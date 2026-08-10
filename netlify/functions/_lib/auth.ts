import type { HandlerEvent } from '@netlify/functions'
import { getDb, verifyFirebaseToken } from './firebaseAdmin'
import { docData } from './firestoreUtil'
import type { Profile } from '../../../src/lib/types'

export interface AuthedRequest {
  uid: string
  email: string | null
  profile: Profile | null
}

/**
 * Verifies the Firebase ID token and loads the caller's profiles/{uid}
 * doc (creating a minimal default one if it doesn't exist yet - covers
 * the rare race where the client crashed between Firebase sign-up and
 * the profile-create call). Returns null if the token is missing/invalid.
 */
export async function authenticate(event: HandlerEvent): Promise<AuthedRequest | null> {
  const decoded = await verifyFirebaseToken(event)
  if (!decoded) return null

  const db = getDb()
  const ref = db.collection('profiles').doc(decoded.uid)
  const snap = await ref.get()

  let profile = docData<Omit<Profile, 'id'>>(snap)
  if (!profile) {
    const created: Omit<Profile, 'id'> = {
      email: decoded.email ?? null,
      full_name: decoded.name ?? null,
      phone: null,
      role: 'customer',
      created_at: new Date().toISOString(),
    }
    await ref.set(created)
    profile = { id: decoded.uid, ...created }
  }

  return { uid: decoded.uid, email: decoded.email ?? null, profile }
}

export function isAdmin(req: AuthedRequest): boolean {
  return req.profile?.role === 'admin'
}
