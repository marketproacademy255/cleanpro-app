/** Normalizes an Uzbek phone number to "+998XXXXXXXXX", or null if it
 * doesn't look like one. Used to key the telegramAuth collection so both
 * the Python registration bot and this backend agree on the same format. */
export function normalizeUzPhone(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length === 9) return `+998${digits}`
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  return null
}
