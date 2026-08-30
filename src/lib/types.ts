// Domain types used across the app. These mirror the Firestore document
// shapes written/read by netlify/functions/* (see also scripts/seed-firestore.mjs).

export type UserRole = 'customer' | 'admin' | 'cleaner'
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export type BookingFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly'
export type PropertyType = 'home' | 'office'
export type PaymentProvider = 'payme' | 'click' | 'manual'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'
export type PricingUnit = 'per_room' | 'per_sqm' | 'flat'
export type BookingTier = 'standard' | 'premium' | 'elite'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
  // Saved UI language ('uz' | 'en' | 'ru') so it follows the user across
  // devices/sessions once logged in - see LanguageContext + App.tsx's sync
  // effect. Optional/nullable since older profiles won't have it yet.
  language?: string | null
  // Referral program (see netlify/functions/referrals.ts). This user's own
  // shareable code - lazily generated the first time they open the
  // referral card or the referrals endpoint, so older profiles won't have
  // one until then.
  referral_code?: string | null
  // uid of whoever referred this user in, if any (set once, at redemption
  // time - see referrals.ts POST). Prevents redeeming a second code.
  referred_by?: string | null
  // True from the moment this user redeems someone else's referral code
  // until their next booking is created - bookings.ts POST consumes this
  // flag to apply REFERRAL_REFERRED_DISCOUNT, then clears it.
  referral_discount_pending?: boolean
  // Running total of referral rewards earned as a referrer, in so'm.
  // There's no wallet/auto-payout rail on this project (see the Click
  // payout discussion) - this is a running ledger the admin applies
  // manually to a future invoice/payout, not money the user can withdraw
  // through the app itself.
  referral_credits_uzs?: number
}

export interface Cleaner {
  id: string
  profile_id: string | null
  full_name: string
  phone: string | null
  photo_url: string | null
  bio: string | null
  years_experience: number
  rating: number
  is_active: boolean
  created_at: string
}

export type ServiceCategory = 'cleaning' | 'repair'

export interface ServiceType {
  id: string
  code: string
  name_uz: string
  name_en: string | null
  // Optional Russian name - added alongside the site's UZ/EN/RU language
  // switcher. Older seed data / Firestore docs written before this field
  // existed simply won't have it, so every read site falls back to
  // name_en, then name_uz (see getServiceName() in lib/i18nHelpers.ts).
  name_ru?: string | null
  description_uz: string | null
  // Optional Russian description, mirroring name_ru: the Admin panel only
  // edits description_uz, so rows written before/without a translation
  // simply won't have it and fall back to description_uz (see
  // getServiceDescription() in lib/i18nHelpers.ts).
  description_ru?: string | null
  property_type: PropertyType
  pricing_unit: PricingUnit
  base_price: number
  extra_unit_price: number
  min_price: number
  multiplier: number
  is_active: boolean
  sort_order: number
  created_at: string
  // Which tab this service shows under on the Booking page. Missing/absent
  // is treated as 'cleaning' for backward compatibility with rows seeded
  // before the Repair category existed.
  category?: ServiceCategory
  // Photo shown on the Booking page's service picker and (for the
  // highlighted set) the Home page tiles. Optional so older rows without
  // one just fall back to no image instead of breaking.
  image?: string | null
  // Extra fraction of the base price added per floor above ground level,
  // e.g. 0.03 = +3% per floor. Used for repair services (painting,
  // furniture installation, ...) where higher floors cost more to service
  // (equipment/material lifting, logistics). 0/undefined means the floor
  // number has no effect on price.
  floor_multiplier?: number
}

export interface Addon {
  id: string
  code: string
  name_uz: string
  price: number
  is_active: boolean
  sort_order: number
}

export interface Booking {
  id: string
  customer_id: string | null
  service_type_id: string
  cleaner_id: string | null
  property_type: PropertyType
  rooms: number
  area_sqm: number | null
  address: string
  city: string
  scheduled_date: string
  scheduled_time: string
  frequency: BookingFrequency
  tier: BookingTier
  addon_codes: string[]
  contact_name: string | null
  contact_phone: string
  notes: string | null
  base_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  status: BookingStatus
  created_at: string
  updated_at: string
  // Optional project photos + free-text description, collected on the
  // Booking page only for repair/renovation services (large repair jobs
  // don't price accurately from a flat per-sqm formula alone - see
  // REPAIR_TIER_MULTIPLIER). Photos are compressed data: URLs (same
  // approach as payment receipts - no Storage bucket on this project).
  repair_photos?: string[]
  repair_notes?: string | null
  service_types?: ServiceType
  cleaners?: Cleaner
  payments?: Payment[]
}

/** A manually-collected customer review, shown (once approved) as the
 * aggregate star rating + a few quote cards on the Home page. Added via
 * the admin panel (Admin > Sharhlar) after asking real customers - never
 * auto-generated, per this project's "don't show fake trust signals"
 * principle (see TeamPreview.tsx). */
export interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
}

export interface Payment {
  id: string
  booking_id: string
  provider: PaymentProvider
  provider_transaction_id: string | null
  amount: number
  state: string | null
  status: PaymentStatus
  receipt_url: string | null
  raw_payload: unknown
  created_at: string
  updated_at: string
  performed_at: string | null
  cancelled_at: string | null
}

