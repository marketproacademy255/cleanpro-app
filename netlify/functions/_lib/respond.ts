import type { HandlerResponse } from '@netlify/functions'

export function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const unauthorized = () => json(401, { error: 'Tizimga kirish talab qilinadi.' })
export const forbidden = () => json(403, { error: "Bu amal uchun ruxsatingiz yo'q." })
export const notFound = () => json(404, { error: 'Topilmadi.' })
export const badRequest = (message: string) => json(400, { error: message })
export const serverError = (message = 'Server xatoligi.') => json(500, { error: message })
export const tooManyRequests = (message = "Juda ko'p so'rov yuborildi. Birozdan so'ng qayta urinib ko'ring.") =>
  json(429, { error: message })
