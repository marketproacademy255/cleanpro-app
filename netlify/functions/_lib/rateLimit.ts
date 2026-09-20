import type { HandlerEvent } from '@netlify/functions'
import { getDb } from './firebaseAdmin'

/**
 * Serverless rate-limiter supporting Upstash Redis REST API with seamless
 * Firestore / in-memory sliding-window fallback.
 *
 * If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment
 * variables are configured, requests are validated against Upstash Redis
 * ZSET sliding logs in sub-millisecond REST round-trips. Otherwise, it
 * falls back to Firestore `rateLimits` collection tracking.
 */

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    try {
      const allowed = await checkRateLimitUpstash(url, token, key, limit, windowMs)
      return allowed
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Upstash Redis rate-limit check failed, falling back to Firestore:', err)
    }
  }

  return checkRateLimitFirestore(key, limit, windowMs)
}

async function checkRateLimitUpstash(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const safeKey = `ratelimit:${key.replace(/[/:]/g, '_')}`
  const now = Date.now()
  const clearBefore = now - windowMs
  const expireSeconds = Math.ceil(windowMs / 1000)

  // Send atomic pipeline via Upstash Redis REST API
  const pipeline = [
    ['ZREMRANGEBYSCORE', safeKey, '0', String(clearBefore)],
    ['ZADD', safeKey, String(now), String(now)],
    ['ZCARD', safeKey],
    ['EXPIRE', safeKey, String(expireSeconds)],
  ]

  const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
  })

  if (!response.ok) {
    throw new Error(`Upstash REST error: status ${response.status}`)
  }

  const results: Array<{ result: unknown; error?: string }> = await response.json()
  const countResult = results[2]?.result
  const count = typeof countResult === 'number' ? countResult : 1

  return count <= limit
}

async function checkRateLimitFirestore(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getDb()
  const safeKey = key.replace(/\//g, '_')
  const ref = db.collection('rateLimits').doc(safeKey)
  const now = Date.now()

  try {
    const snap = await ref.get()
    const timestamps: number[] = Array.isArray(snap.data()?.timestamps) ? snap.data()!.timestamps : []
    const recent = timestamps.filter((t) => typeof t === 'number' && now - t < windowMs)

    if (recent.length >= limit) {
      await ref.set({ timestamps: recent, updated_at: new Date(now).toISOString() }, { merge: true })
      return false
    }

    recent.push(now)
    await ref.set({ timestamps: recent, updated_at: new Date(now).toISOString() }, { merge: true })
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Firestore rate-limit check failed:', err)
    return true // fail open if storage is down to avoid blocking legit users
  }
}

/**
 * Best-effort client IP extraction for serverless functions.
 * `x-nf-client-connection-ip` is provided by Netlify Edge and cannot be spoofed.
 */
export function getClientIp(event: HandlerEvent): string {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  )
}
