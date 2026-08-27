import type { Addon, BookingFrequency, BookingTier, ServiceType } from './types'

export const FREQUENCY_DISCOUNT: Record<BookingFrequency, number> = {
  once: 0,
  weekly: 0.2,
  biweekly: 0.15,
  monthly: 0.1,
}

/**
 * Automatic new-customer incentive (no promo code needed) - applied to a
 * customer's very first booking, on top of whatever frequency discount
 * they picked. See netlify/functions/bookings.ts, which determines
 * eligibility server-side (queries for any prior booking by this
 * customer_id) - never trust a client-sent flag for a discount.
 */
export const FIRST_BOOKING_DISCOUNT = 0.1

/**
 * Referral program reward for the *referred* friend's first booking -
 * bigger than the plain first-booking discount above (and replaces it,
 * they're not stacked) since the referrer also earns
 * REFERRAL_REWARD_UZS (see netlify/functions/_lib/referral.ts) once that
 * booking completes. See netlify/functions/referrals.ts for the
 * redeem/reward flow.
 */
export const REFERRAL_REFERRED_DISCOUNT = 0.2

export const FREQUENCY_LABEL_UZ: Record<BookingFrequency, string> = {
  once: 'Bir martalik',
  weekly: 'Har hafta (-20%)',
  biweekly: 'Ikki haftada bir (-15%)',
  monthly: 'Oyiga bir marta (-10%)',
}

/**
 * Service tariffs (tiers). These sit on top of the chosen service type and
 * scale its price with a multiplier - they don't change what gets cleaned,
 * they change how the visit is delivered (staff seniority, extra QA pass,
 * priority scheduling, etc). Selected once per booking on the Booking page.
 */
export const TIER_MULTIPLIER: Record<BookingTier, number> = {
  standard: 1,
  premium: 1.3,
  elite: 1.65,
}

/**
 * Repair/renovation services reuse the same 3 tier "slots" (standard/premium/
 * elite) as cleaning, but they mean something different: a Tashkent
 * renovation market typically splits into "Kosmetik" (light/budget), "Standart"
 * (mid-grade capital repair - the baseline) and "Evroremont" (premium/design-
 * grade, ~2x the baseline). See TIER_LABEL_UZ vs REPAIR_TIER_LABEL_UZ (and the
 * `pricing.repairTierLabels`/`repairTierPerks` i18n namespace) for the
 * repair-specific labels/perks shown on the Booking page.
 */
export const REPAIR_TIER_MULTIPLIER: Record<BookingTier, number> = {
  standard: 0.6, // Kosmetik
  premium: 1.0, // Standart (baseline - service base_price/extra_unit_price already target this tier)
  elite: 1.9, // Evroremont
}

export const REPAIR_TIER_LABEL_UZ: Record<BookingTier, string> = {
  standard: 'Kosmetik',
  premium: 'Standart',
  elite: 'Evroremont',
}

export const TIER_LABEL_UZ: Record<BookingTier, string> = {
  standard: 'Standart',
  premium: 'Premium',
  elite: 'Elite',
}

export const TIER_PERKS_UZ: Record<BookingTier, string[]> = {
  standard: ["Tajribali xizmatchi", "Standart tozalash vositalari", "Belgilangan kunda tashrif"],
  premium: [
    "Katta tajribaga ega xizmatchi",
    "Premium ekologik vositalar",
    "Qo'shimcha sifat nazorati",
    "Vaqtni tanlashda ustuvorlik",
  ],
  elite: [
    "Eng yuqori reytingli jamoa boshlig'i",
    "Premium vositalar + zararsizlantirish",
    "2 bosqichli sifat nazorati",
    "Bir soatlik aniq vaqt oynasi",
    "24/7 ustuvor mijozlarni qo'llab-quvvatlash",
  ],
}

export interface PriceBreakdown {
  baseAmount: number
  tierAmount: number
  addonsAmount: number
  subtotal: number
  discountAmount: number
  /** Portion of discountAmount coming from FIRST_BOOKING_DISCOUNT or
   *  REFERRAL_REFERRED_DISCOUNT (see extraDiscountRate param), shown as its
   *  own line on the Booking page so it doesn't get confused with the
   *  frequency discount. Already included in discountAmount/totalAmount. */
  extraDiscountAmount: number
  totalAmount: number
}

/**
 * Calculates the price for a booking based on the selected service, size
 * (rooms or square meters), chosen add-ons and recurrence frequency.
 *
 * - `per_room` services scale with `base_price` for the first room plus
 *   `extra_unit_price` for each additional room.
 * - `per_sqm` services multiply `extra_unit_price` by the area, with a
 *   `min_price` floor.
 */
export function calculatePrice(params: {
  service: ServiceType
  rooms: number
  areaSqm?: number | null
  selectedAddons: Addon[]
  frequency: BookingFrequency
  tier?: BookingTier
  /** Floor number the property is on (1 = ground). Only affects price when
   *  the service has a `floor_multiplier` set (repair-category services). */
  floor?: number | null
  /** FIRST_BOOKING_DISCOUNT or REFERRAL_REFERRED_DISCOUNT (0 if neither
   *  applies) - the caller (bookings.ts, or Booking.tsx for preview only)
   *  decides which one applies; calculatePrice just applies the number. */
  extraDiscountRate?: number
}): PriceBreakdown {
  const { service, rooms, areaSqm, selectedAddons, frequency, tier = 'standard', floor, extraDiscountRate = 0 } = params

  let base = 0
  if (service.pricing_unit === 'per_room') {
    const extraRooms = Math.max(0, rooms - 1)
    base = service.base_price + extraRooms * service.extra_unit_price
  } else if (service.pricing_unit === 'per_sqm') {
    const area = areaSqm && areaSqm > 0 ? areaSqm : 0
    base = area * service.extra_unit_price
  } else {
    base = service.base_price
  }

  base = base * service.multiplier

  if (service.floor_multiplier && floor && floor > 1) {
    // Floor 1 (ground) is the baseline - each floor above it adds
    // floor_multiplier as extra fraction of the base price (e.g. 0.03 and
    // floor 5 -> +12% for the 4 floors above ground).
    base = base * (1 + service.floor_multiplier * (floor - 1))
  }

  base = Math.max(base, service.min_price)

  // Repair services use their own tier multiplier scale (Kosmetik/Standart/
  // Evroremont) instead of the cleaning one (Standard/Premium/Elite) - see
  // REPAIR_TIER_MULTIPLIER above.
  const multiplierMap = service.category === 'repair' ? REPAIR_TIER_MULTIPLIER : TIER_MULTIPLIER
  const tierMultiplier = multiplierMap[tier] ?? 1
  const tierAmount = base * (tierMultiplier - 1)
  const baseWithTier = base + tierAmount

  const addonsAmount = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const subtotal = baseWithTier + addonsAmount
  const discountRate = FREQUENCY_DISCOUNT[frequency] ?? 0
  const frequencyDiscountAmount = Math.round(subtotal * discountRate)
  const extraDiscountAmount = Math.round(subtotal * Math.max(0, extraDiscountRate))
  const discountAmount = frequencyDiscountAmount + extraDiscountAmount
  const totalAmount = subtotal - discountAmount

  return {
    baseAmount: Math.round(base),
    tierAmount: Math.round(tierAmount),
    addonsAmount: Math.round(addonsAmount),
    subtotal: Math.round(subtotal),
    discountAmount,
    extraDiscountAmount,
    totalAmount: Math.round(totalAmount),
  }
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + " so'm"
}
