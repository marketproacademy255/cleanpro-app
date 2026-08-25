import type { HandlerEvent } from '@netlify/functions'
import { getDb } from './firebaseAdmin'

/**
 * Simple Firestore-backed sliding-window rate limiter for the handful of
 * PUBLIC (unauthenticated) Netlify Functions - ai-chat.ts, contact.ts,
 * telegram-login-request.ts. Netlify Functions are stateless/serverless
 * (each invocation can land on a fresh instance), so an in-memory counter
 * would silently reset per-instance and do nothing - Firestore gives us a
 * counter that's actually shared across instances.
 *
 * This is intentionally simple (one doc read + one write per call, small
 * arrays capped at `limit` entries) - fine for the traffic these endpoints
 * see. If this ever needs to handle serious volume, swap it for Upstash
 * Redis + `@upstash/ratelimit` instead (near-instant, no Firestore round
 * trip) - the call sites below wouldn't need to change, just this file.
 *
 * Like every other Firestore write in netlify/functions, this goes through
 * the Admin SDK and therefore bypasses firestore.rules entirely - that's
 * fine here since `rateLimits/*` holds no user data, only request counts.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getDb()
  // Firestore doc IDs can't contain '/', which IPv6 addresses never have
  // but which could theoretically sneak in via a crafted key - normalize
  // just in case.
  const safeKey = key.replace(/\//g, '_')
  const ref = db.collection('rateLimits').doc(safeKey)
  const now = Date.now()

  const snap = await ref.get()
  const timestamps: number[] = Array.isArray(snap.data()?.timestamps) ? snap.data()!.timestamps : []
  const recent = timestamps.filter((t) => typeof t === 'number' && now - t < windowMs)

  if (recent.length >= limit) {
    // Still prune the stored array even when rejecting, so it doesn't grow
    // unbounded under sustained abuse.
    await ref.set({ timestamps: recent, updated_at: new Date(now).toISOString() }, { merge: true })
    return false
  }

  recent.push(now)
  await ref.set({ timestamps: recent, updated_at: new Date(now).toISOString() }, { merge: true })
  return true
}

/**
 * Best-effort client IP for public endpoints. `x-nf-client-connection-ip`
 * is set by Netlify's edge from the actual TCP connection and can't be
 * spoofed by the client (unlike `x-forwarded-for`, which we fall back to
 * only if the Netlify-specific header is somehow missing, e.g. local dev).
 */
export function getClientIp(event: HandlerEvent): string {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  )
}
