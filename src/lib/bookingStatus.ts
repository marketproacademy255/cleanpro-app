import type { BookingStatus } from './types'

export interface StatusMeta {
  label: string
  color: string
}

/**
 * Central status labels/badge colors, shared by Dashboard.tsx (booking list
 * chips) and BookingDetail.tsx (the stepper). Labels are localized, so this
 * takes the `t()` function from useTranslation() rather than being a plain
 * static object - call it once per render.
 */
export function bookingStatusMeta(t: (key: string) => string): Record<BookingStatus, StatusMeta> {
  return {
    pending: { label: t('dashboard.statusPending'), color: 'bg-amber-50 text-amber-700' },
    confirmed: { label: t('dashboard.statusConfirmed'), color: 'bg-blue-50 text-blue-700' },
    assigned: { label: t('dashboard.statusAssigned'), color: 'bg-indigo-50 text-indigo-700' },
    in_progress: { label: t('dashboard.statusInProgress'), color: 'bg-purple-50 text-purple-700' },
    completed: { label: t('dashboard.statusCompleted'), color: 'bg-green-50 text-green-700' },
    cancelled: { label: t('dashboard.statusCancelled'), color: 'bg-gray-100 text-gray-500' },
  }
}

/** Ordered steps for the BookingDetail progress stepper - `cancelled` is
 *  handled separately (as a banner, not a step) since it can happen from
 *  any point in the flow, not just at the end. */
export const STATUS_STEPS: BookingStatus[] = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed']
