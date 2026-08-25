import { timingSafeEqual } from 'node:crypto'

/**
 * Constant-time string comparison for webhook signature/credential checks
 * (payme.ts's checkAuth, click.ts's verifySign). A plain `===` short-circuits
 * on the first mismatching byte, so its runtime leaks (in theory) how many
 * leading characters of a guess were correct - a patient attacker could use
 * that timing signal to recover a secret key byte-by-byte instead of having
 * to brute-force it all at once. In practice this needs a very controlled,
 * low-jitter network path to be exploitable (which is why the audit rates it
 * low priority), but it's a one-line fix so there's no reason not to.
 *
 * `timingSafeEqual` throws if the two buffers aren't the same length, so we
 * check that first - that length check is itself not secret-dependent (an
 * attacker learning "your key isn't N characters" isn't useful), so doing it
 * before the constant-time compare doesn't reintroduce a meaningful leak.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
