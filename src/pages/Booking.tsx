import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, AlertCircle, Star, UserCheck, Repeat } from 'lucide-react'
import MapLocationPicker, { type LocationDetails } from '@/components/MapLocationPicker'
import { PageSkeleton } from '@/components/SkeletonLoaders'
import { fetchActiveAddons, fetchActiveCleaners, fetchActiveServiceTypes } from '@/lib/publicData'
import { apiFetch, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { triggerHaptic } from '@/lib/haptics'
import { bookingFormSchema, type BookingFormValues } from '@/lib/validationSchemas'
import {
  calculatePrice,
  formatUZS,
  FIRST_BOOKING_DISCOUNT,
  REFERRAL_REFERRED_DISCOUNT,
  TIER_MULTIPLIER,
} from '@/lib/pricing'
import { BOOKING_DRAFT_KEY } from '@/lib/config'
import type { Addon, Booking as BookingRow, BookingFrequency, BookingTier, Cleaner, ServiceType } from '@/lib/types'

const TIERS: BookingTier[] = ['standard', 'premium', 'elite']
export const DRAFT_KEY = BOOKING_DRAFT_KEY

const WORKING_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
]


const DEFAULT_BOOKING_SERVICES: ServiceType[] = [
  {
    id: 'standard_home',
    code: 'standard_home',
    name_uz: 'Standart tozalash',
    name_ru: 'Стандартная уборка',
    name_en: 'Standard Cleaning',
    description_uz: 'Uyni muntazam toza saqlash uchun standart tozalash xizmati.',
    description_ru: 'Стандартная уборка для поддержания чистоты дома.',
    property_type: 'home',
    pricing_unit: 'per_room',
    base_price: 150000,
    extra_unit_price: 40000,
    min_price: 150000,
    multiplier: 1,
    is_active: true,
    sort_order: 1,
    category: 'cleaning',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'deep_home',
    code: 'deep_home',
    name_uz: 'Chuqur tozalash',
    name_ru: 'Генеральная уборка',
    name_en: 'Deep Cleaning',
    description_uz: 'Har bir burchakni ehtiyotkorlik bilan tozalaydigan chuqur tozalash.',
    description_ru: 'Генеральная уборка, очищающая каждый уголок.',
    property_type: 'home',
    pricing_unit: 'per_room',
    base_price: 210000,
    extra_unit_price: 56000,
    min_price: 210000,
    multiplier: 1.2,
    is_active: true,
    sort_order: 2,
    category: 'cleaning',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'office_clean',
    code: 'office_clean',
    name_uz: 'Ofis tozalash',
    name_ru: 'Уборка офисов',
    name_en: 'Office Cleaning',
    description_uz: 'Ish joyingizni toza va ozoda saqlash uchun professional ofis tozalash xizmati.',
    description_ru: 'Профессиональная уборка офисов для поддержания чистоты рабочего места.',
    property_type: 'office',
    pricing_unit: 'per_room',
    base_price: 180000,
    extra_unit_price: 45000,
    min_price: 180000,
    multiplier: 1.1,
    is_active: true,
    sort_order: 3,
    category: 'cleaning',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
  },
]

export default function Booking() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [services, setServices] = useState<ServiceType[]>(DEFAULT_BOOKING_SERVICES)
  const [addons, setAddons] = useState<Addon[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null)
  const [isSubscription, setIsSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFirstBooking, setIsFirstBooking] = useState(false)

  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: DEFAULT_BOOKING_SERVICES[0].id,
      rooms: 1,
      areaSqm: '',
      floor: '',
      address: '',
      addressNotes: '',
      city: 'Toshkent',
      date: '',
      time: '09:00',
      frequency: 'once',
      tier: 'standard',
      addonCodes: [],
      contactName: '',
      contactPhone: '',
      notes: '',
    },
  })

  const formValues = watch()
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null)

  // Fetch available times when date changes
  useEffect(() => {
    if (!formValues.date) return
    setLoadingTimes(true)
    apiFetch<{ bookedTimes: string[] }>(`available-times?date=${formValues.date}`)
      .then((res) => {
        const booked = res.bookedTimes || []
        setBookedTimes(booked)
        if (booked.includes(formValues.time)) {
          const firstAvailable = WORKING_HOURS.find((t) => !booked.includes(t))
          if (firstAvailable) {
            setValue('time', firstAvailable)
          }
        }
      })
      .catch(() => setBookedTimes([]))
      .finally(() => setLoadingTimes(false))
  }, [formValues.date, formValues.time, setValue])

  // Check prior bookings for discount preview & address auto-fill
  useEffect(() => {
    if (!user) return
    apiFetch<BookingRow[]>('bookings')
      .then((rows) => {
        setIsFirstBooking(rows.length === 0)
        // Auto-fill address from last booking if address field is currently empty
        if (rows.length > 0 && !formValues.address) {
          const lastBooking = rows[0]
          if (lastBooking.address) {
            // Strip out notes in parentheses if present
            const cleanAddr = lastBooking.address.split(" (Mo'ljal")[0]
            setValue('address', cleanAddr)
          }
        }
      })
      .catch(() => {})
  }, [user, setValue, formValues.address])

  const isReferred = !!profile?.referral_discount_pending
  const extraDiscountRate = isReferred ? REFERRAL_REFERRED_DISCOUNT : isFirstBooking ? FIRST_BOOKING_DISCOUNT : 0

  useEffect(() => {
    async function load() {
      try {
        const [serviceList, ad, clList] = await Promise.all([
          fetchActiveServiceTypes(),
          fetchActiveAddons(),
          fetchActiveCleaners(),
        ])
        if (serviceList && serviceList.length > 0) {
          setServices(serviceList)
        }
        setAddons(ad)
        setCleaners(clList)

        const userDraftKey = `cleanpro_booking_draft_v2_${user?.uid || 'guest'}`
        const draftRaw =
          localStorage.getItem(userDraftKey) ||
          localStorage.getItem('cleanpro_booking_draft_v2') ||
          sessionStorage.getItem(DRAFT_KEY)

        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw)
            if (draft.serviceId) setValue('serviceId', draft.serviceId)
            if (draft.rooms) setValue('rooms', Number(draft.rooms))
            if (draft.areaSqm) setValue('areaSqm', draft.areaSqm)
            if (draft.floor) setValue('floor', draft.floor)
            if (draft.address) setValue('address', draft.address)
            if (draft.addressNotes) setValue('addressNotes', draft.addressNotes)
            if (draft.city) setValue('city', draft.city)
            if (draft.date) setValue('date', draft.date)
            if (draft.time) setValue('time', draft.time)
            if (draft.frequency) setValue('frequency', draft.frequency)
            if (draft.tier) setValue('tier', draft.tier)
            if (draft.addonCodes && Array.isArray(draft.addonCodes)) setValue('addonCodes', draft.addonCodes)
            if (draft.contactName) setValue('contactName', draft.contactName)
            if (draft.contactPhone) setValue('contactPhone', draft.contactPhone)
            if (draft.notes) setValue('notes', draft.notes)

            if (draft.locationDetails) setLocationDetails(draft.locationDetails)
            if (typeof draft.isSubscription === 'boolean') setIsSubscription(draft.isSubscription)
            if (draft.selectedCleanerId) setSelectedCleanerId(draft.selectedCleanerId)
          } catch {
            // Ignore corrupted draft
          }
        } else {
          const listToUse = serviceList.length > 0 ? serviceList : DEFAULT_BOOKING_SERVICES
          const firstCleaning = listToUse.find((s) => (s.category ?? 'cleaning') === 'cleaning') || listToUse[0]
          if (firstCleaning) setValue('serviceId', firstCleaning.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('booking.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save form draft to localStorage in real-time
  useEffect(() => {
    if (loading) return
    const userKey = `cleanpro_booking_draft_v2_${user?.uid || 'guest'}`
    const draftData = {
      ...formValues,
      locationDetails,
      isSubscription,
      selectedCleanerId,
      updatedAt: Date.now(),
    }
    try {
      const jsonStr = JSON.stringify(draftData)
      localStorage.setItem(userKey, jsonStr)
      localStorage.setItem('cleanpro_booking_draft_v2', jsonStr)
    } catch {
      // Ignore storage errors
    }
  }, [formValues, locationDetails, isSubscription, selectedCleanerId, user?.uid, loading])

  // Auto-fill user profile info
  useEffect(() => {
    if (profile) {
      if (!formValues.contactName && profile.full_name) {
        setValue('contactName', profile.full_name)
      }
      if (!formValues.contactPhone && profile.phone) {
        setValue('contactPhone', profile.phone)
      }
    }
  }, [profile, setValue, formValues.contactName, formValues.contactPhone])

  const availableServices = useMemo(() => {
    return services.length > 0 ? services : DEFAULT_BOOKING_SERVICES
  }, [services])

  useEffect(() => {
    if (!services.length) return
    const stillValid = availableServices.some((s) => s.id === formValues.serviceId)
    if (!stillValid && availableServices[0]) {
      setValue('serviceId', availableServices[0].id)
    }
  }, [services, availableServices, formValues.serviceId, setValue])

  const selectedService = availableServices.find((s) => s.id === formValues.serviceId) || availableServices[0]
  const selectedAddons = addons.filter((a) => (formValues.addonCodes || []).includes(a.code))
  const showFloorInput = !!selectedService?.floor_multiplier

  const priceBreakdown = useMemo(() => {
    if (!selectedService) return null
    return calculatePrice({
      service: selectedService,
      rooms: formValues.rooms || 1,
      areaSqm: formValues.areaSqm ? Number(formValues.areaSqm) : null,
      selectedAddons,
      frequency: formValues.frequency || 'once',
      tier: formValues.tier || 'standard',
      floor: formValues.floor ? Number(formValues.floor) : null,
      extraDiscountRate,
    })
  }, [selectedService, formValues.rooms, formValues.areaSqm, formValues.floor, selectedAddons, formValues.frequency, formValues.tier, extraDiscountRate])

  function toggleAddon(code: string) {
    triggerHaptic('light')
    const current = formValues.addonCodes || []
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code]
    setValue('addonCodes', updated)
  }

  async function onSubmit(data: BookingFormValues) {
    setError(null)
    triggerHaptic('medium')

    if (!selectedService || !priceBreakdown) {
      setError(t('booking.selectServiceError'))
      return
    }

    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data))
      navigate('/login', { state: { from: '/booking', message: 'Buyurtmani yakunlash uchun tizimga kiring' } })
      return
    }

    setSubmitting(true)
    try {
      const resData = await apiFetch<BookingRow>('bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          rooms: data.rooms,
          areaSqm: data.areaSqm ? Number(data.areaSqm) : null,
          floor: locationDetails?.floor ? Number(locationDetails.floor) : (data.floor ? Number(data.floor) : null),
          apartment: locationDetails?.apartment || null,
          entrance: locationDetails?.entrance || null,
          intercom: locationDetails?.intercom || null,
          landmark: locationDetails?.landmark || (data.addressNotes ?? null),
          lat: locationDetails?.lat || null,
          lng: locationDetails?.lng || null,
          address: data.addressNotes ? `${data.address} (Mo'ljal: ${data.addressNotes})` : data.address,
          city: data.city,
          date: data.date,
          time: data.time,
          frequency: data.frequency,
          tier: data.tier,
          addonCodes: data.addonCodes,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          notes: data.notes,
          cleanerId: selectedCleanerId,
          isSubscription,
        }),
      })
      triggerHaptic('success')
      const userKey = `cleanpro_booking_draft_v2_${user?.uid || 'guest'}`
      localStorage.removeItem(userKey)
      localStorage.removeItem('cleanpro_booking_draft_v2')
      sessionStorage.removeItem(DRAFT_KEY)
      navigate(`/dashboard/booking/${resData.id}`)
    } catch (err) {
      triggerHaptic('error')
      setError(err instanceof ApiError ? err.message : t('booking.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const tierLabels = t('pricing.tierLabels') as Record<BookingTier, string>
  const tierPerks = t('pricing.tierPerks') as Record<BookingTier, string[]>
  const tierMultiplierMap = TIER_MULTIPLIER
  const frequencyLabels = t('pricing.frequencyLabels') as Record<BookingFrequency, string>

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="section py-14 pb-24 lg:pb-14">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('booking.title')}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{t('booking.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Property details & Map */}
          <div className="card grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t('booking.propertyType')}</label>
              <select
                className="input"
                value={selectedService?.property_type === 'office' ? 'office' : 'home'}
                onChange={(e) => {
                  triggerHaptic('light')
                  const targetType = e.target.value
                  const match = availableServices.find((s) => s.property_type === targetType) || availableServices[0]
                  if (match) setValue('serviceId', match.id)
                }}
              >
                <option value="home">{t('booking.home')}</option>
                <option value="office">{t('booking.office')}</option>
              </select>
            </div>
            {selectedService?.pricing_unit === 'per_sqm' ? (
              <div>
                <label className="label">{t('booking.area')}</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  {...register('areaSqm')}
                />
              </div>
            ) : (
              <div>
                <label className="label">{t('booking.rooms')}</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input"
                  {...register('rooms', { valueAsNumber: true })}
                />
                {errors.rooms && <p className="mt-1 text-xs text-red-500">{errors.rooms.message}</p>}
              </div>
            )}
            {showFloorInput && (
              <div className="sm:col-span-2">
                <label className="label">{t('booking.floor')}</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="input"
                  {...register('floor')}
                />
                <p className="mt-1 text-xs text-gray-400">{t('booking.floorHelp')}</p>
              </div>
            )}
            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="label">{t('booking.city')}</label>
                <select
                  className="input"
                  {...register('city')}
                >
                  <option value="Toshkent">Toshkent</option>
                  <option value="Samarqand">Samarqand</option>
                </select>
              </div>

              {/* Interactive Map Location Picker */}
              <MapLocationPicker
                city={formValues.city}
                initialAddress={formValues.address}
                initialDetails={locationDetails || undefined}
                onLocationSelect={(loc) => {
                  setLocationDetails(loc)
                  setValue('address', loc.address, { shouldValidate: true })
                  if (loc.landmark) setValue('addressNotes', loc.landmark)
                }}
              />

              <div>
                <label className="label">{t('booking.address')}</label>
                <input
                  className="input"
                  placeholder={t('booking.addressPlaceholder')}
                  {...register('address')}
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
              </div>

              <div>
                <label className="label">Manzilga qo'shimcha izoh / Mo'ljallash (pod'yezd, etaj, kod)</label>
                <input
                  className="input"
                  placeholder="Mo'ljal: korzinka ro'parasidagi bino, 2-pod'yezd, 4-qavat..."
                  {...register('addressNotes')}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('booking.frequency')}</label>
              <select className="input" {...register('frequency')}>
                {Object.entries(frequencyLabels).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl as string}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('booking.date')}</label>
              <input
                type="date"
                className="input"
                min={new Date().toISOString().slice(0, 10)}
                {...register('date')}
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t('booking.time')} (Ish vaqti: 09:00 - 18:00)</label>
              {!formValues.date ? (
                <p className="mt-1 text-xs text-amber-600 bg-amber-50 rounded-md p-2">Avval buyurtma sanasini tanlang</p>
              ) : loadingTimes ? (
                <p className="mt-1 text-xs text-gray-400">Vaqtlar tekshirilmoqda...</p>
              ) : (
                <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {WORKING_HOURS.map((tSlot) => {
                    const isBooked = bookedTimes.includes(tSlot)
                    const isSelected = formValues.time === tSlot
                    return (
                      <button
                        type="button"
                        key={tSlot}
                        disabled={isBooked}
                        onClick={() => {
                          triggerHaptic('light')
                          setValue('time', tSlot)
                        }}
                        className={`flex flex-col items-center justify-center rounded-lg border py-2 text-xs font-semibold transition ${
                          isBooked
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through dark:border-gray-800 dark:bg-gray-800'
                            : isSelected
                            ? 'border-brand-600 bg-brand-600 text-white shadow-sm ring-2 ring-brand-200 dark:ring-brand-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        <span>{tSlot}</span>
                        {isBooked && <span className="text-[9px] no-underline font-normal text-red-500">Band</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tier Selection */}
          <div className="card">
            <label className="label font-semibold">{t('booking.tier')}</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TIERS.map((tier) => {
                const pct = Math.round((tierMultiplierMap[tier] - 1) * 100)
                const isSelected = formValues.tier === tier
                return (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => {
                      triggerHaptic('light')
                      setValue('tier', tier)
                    }}
                    className={`rounded-md border p-4 text-left transition ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                        : 'border-gray-200 hover:border-brand-300 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{tierLabels[tier]}</span>
                      {pct !== 0 && (
                        <span className={`tag px-2 py-0.5 text-[11px] text-white ${pct > 0 ? 'bg-brand-600' : 'bg-gray-400'}`}>
                          {pct > 0 ? '+' : ''}{pct}%
                        </span>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {tierPerks[tier].map((perk) => (
                        <li key={perk} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Addons Selection */}
          <div className="card">
            <label className="label font-semibold">{t('booking.addonsLabel')}</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {addons.map((a) => (
                <label key={a.code} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                  <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <input
                      type="checkbox"
                      checked={(formValues.addonCodes || []).includes(a.code)}
                      onChange={() => toggleAddon(a.code)}
                    />
                    {a.name_uz}
                  </span>
                  <span className="text-gray-400">{formatUZS(a.price)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Cleaner Selection */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <label className="label text-base font-semibold mb-0">Afzal ko'rilgan tozalovchi (Ixtiyoriy)</label>
              <span className="text-xs text-gray-400">Sevilarli mutaxassisni tanlang</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light')
                  setSelectedCleanerId(null)
                }}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                  selectedCleanerId === null
                    ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-100 dark:bg-brand-900/20 dark:ring-brand-900'
                    : 'border-gray-200 hover:border-brand-300 dark:border-gray-800'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400 font-bold shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Tizim tayinlasin</div>
                  <div className="text-xs text-gray-500">Eng mos va bo'sh bo'lgan professional</div>
                </div>
              </button>

              {cleaners.map((cl) => {
                const isSel = selectedCleanerId === cl.id
                return (
                  <button
                    type="button"
                    key={cl.id}
                    onClick={() => {
                      triggerHaptic('light')
                      setSelectedCleanerId(cl.id)
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                      isSel
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-100 dark:bg-brand-900/20 dark:ring-brand-900'
                        : 'border-gray-200 hover:border-brand-300 dark:border-gray-800'
                    }`}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      {cl.photo_url ? (
                        <img src={cl.photo_url} alt={cl.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-gray-500">
                          {cl.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="truncate font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {cl.full_name}
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{cl.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {cl.years_experience} yillik tajriba {cl.bio ? `• ${cl.bio}` : ''}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Automatic Recurring Subscription Toggle */}
          <div className="card border-brand-200 bg-gradient-to-r from-brand-50/50 to-white dark:from-brand-950/20 dark:to-gray-900 dark:border-brand-900/40">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => {
                  triggerHaptic('light')
                  setIsSubscription(e.target.checked)
                }}
                className="mt-1 h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                  <Repeat className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span>Avtomatik qayta obuna bo'lish (-20% chegirma)</span>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Xizmat tanlangan chastotaga ko'ra ({frequencyLabels[formValues.frequency || 'once']}) avtomatik takrorlanadi. Obunani istalgan vaqtda shaxsiy kabinetdan bekor qilishingiz yoki to'xtatishingiz mumkin.
                </p>
              </div>
            </label>
          </div>

          {/* Contact Details */}
          <div className="card grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t('booking.nameLabel')}</label>
              <input className="input" {...register('contactName')} />
              {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName.message}</p>}
            </div>
            <div>
              <label className="label">{t('booking.phoneLabel')}</label>
              <input className="input" placeholder="+998 90 123 45 67" {...register('contactPhone')} />
              {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('booking.notesLabel')}</label>
              <textarea className="input" rows={3} {...register('notes')} />
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="card lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('booking.priceDetailsTitle')}</h3>

            {(isReferred || isFirstBooking) && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {isReferred ? t('booking.referralAppliedText') : t('booking.firstBookingText')}
              </p>
            )}

            {priceBreakdown && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Boshlang'ich narx</span>
                  <span>{formatUZS(priceBreakdown.baseAmount)}</span>
                </div>
                {priceBreakdown.tierAmount !== 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tarif moslashuvi</span>
                    <span>{priceBreakdown.tierAmount > 0 ? '+' : ''}{formatUZS(priceBreakdown.tierAmount)}</span>
                  </div>
                )}
                {priceBreakdown.addonsAmount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Qo'shimcha xizmatlar</span>
                    <span>+{formatUZS(priceBreakdown.addonsAmount)}</span>
                  </div>
                )}
                {priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Chegirma</span>
                    <span>-{formatUZS(priceBreakdown.discountAmount)}</span>
                  </div>
                )}
                <hr className="dark:border-gray-800" />
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
                  <span>Jami narx</span>
                  <span className="text-brand-700 dark:text-brand-400">{formatUZS(priceBreakdown.totalAmount)}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-6 w-full py-3 text-base font-semibold shadow-md"
            >
              {submitting ? 'Yuborilmoqda…' : t('booking.submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
