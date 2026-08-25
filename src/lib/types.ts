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
  service_types?: ServiceType
  cleaners?: Cleaner
  payments?: Payment[]
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

