import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebaseClient'

/**
 * Waits for Firebase's local auth-state restore to finish and returns the
 * current user (or null). Using auth.currentUser directly right after a
 * full page load (e.g. landing back on /tolov-natijasi after a payment
 * gateway redirect) can race with Firebase restoring the session, so every
 * API call goes through this instead.
 */
function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = await getCurrentUser()
  if (!user) return {}
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Thin wrapper around fetch() for calling our Netlify Functions backend
 * (netlify/functions/*). Automatically attaches the current Firebase ID
 * token so the function can verify who's calling.
 */
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`/.netlify/functions/${path}`, { ...options, headers })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw new ApiError(json?.error ?? 'Server xatoligi', res.status)
  }
  return json as T
}
