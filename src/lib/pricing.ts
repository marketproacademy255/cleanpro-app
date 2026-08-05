import type { Addon, BookingFrequency, ServiceType } from './types'

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

export interface PriceBreakdown {
  baseAmount: number
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
}): PriceBreakdown {
  const { service, rooms, areaSqm, selectedAddons, frequency } = params

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
  base = Math.max(base, service.min_price)

  const addonsAmount = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const subtotal = base + addonsAmount
  const discountRate = FREQUENCY_DISCOUNT[frequency] ?? 0
  const discountAmount = Math.round(subtotal * discountRate)
  const totalAmount = subtotal - discountAmount

  return {
    baseAmount: Math.round(base),
    addonsAmount: Math.round(addonsAmount),
    subtotal: Math.round(subtotal),
    discountAmount,
    totalAmount: Math.round(totalAmount),
  }
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + " so'm"
}
