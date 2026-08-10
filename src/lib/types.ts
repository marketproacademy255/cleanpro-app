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
export type PaymentProvider = 'payme' | 'click'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'
export type PricingUnit = 'per_room' | 'per_sqm' | 'flat'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
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

export interface ServiceType {
  id: string
  code: string
  name_uz: string
  name_en: string | null
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
  raw_payload: unknown
  created_at: string
  updated_at: string
  performed_at: string | null
  cancelled_at: string | null
}

