import type { Addon, BookingFrequency, BookingTier, ServiceType } from './types'

export const FREQUENCY_DISCOUNT: Record<BookingFrequency, number> = {
  once: 0,
  weekly: 0.2,
  biweekly: 0.15,
  monthly: 0.1,
}

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
}): PriceBreakdown {
  const { service, rooms, areaSqm, selectedAddons, frequency, tier = 'standard', floor } = params

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

  const tierMultiplier = TIER_MULTIPLIER[tier] ?? 1
  const tierAmount = base * (tierMultiplier - 1)
  const baseWithTier = base + tierAmount

  const addonsAmount = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const subtotal = baseWithTier + addonsAmount
  const discountRate = FREQUENCY_DISCOUNT[frequency] ?? 0
  const discountAmount = Math.round(subtotal * discountRate)
  const totalAmount = subtotal - discountAmount

  return {
    baseAmount: Math.round(base),
    tierAmount: Math.round(tierAmount),
    addonsAmount: Math.round(addonsAmount),
    subtotal: Math.round(subtotal),
    discountAmount,
    totalAmount: Math.round(totalAmount),
  }
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + " so'm"
}
