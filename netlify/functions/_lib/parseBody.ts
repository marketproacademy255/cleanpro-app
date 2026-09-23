import type { HandlerEvent } from '@netlify/functions'

export function rawBody(event: HandlerEvent): string {
  if (!event.body) return ''
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body
}

/** Payme sends JSON-RPC (application/json). Click sends either JSON or
 * classic form-urlencoded depending on how it's configured - handle both. */
export function parseFormOrJson(event: HandlerEvent): Record<string, string> {
  const contentType = event.headers['content-type'] ?? event.headers['Content-Type'] ?? ''
  const body = rawBody(event)
  const obj: Record<string, string> = {}

  if (event.queryStringParameters) {
    for (const [k, v] of Object.entries(event.queryStringParameters)) {
      if (v !== undefined) obj[k] = v
    }
  }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body || '{}')
      return { ...obj, ...parsed }
    } catch {
      return obj
    }
  }

  if (body) {
    const params = new URLSearchParams(body)
    for (const [k, v] of params.entries()) obj[k] = v
  }

  return obj
}
