import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { fetchActiveAddons, fetchActiveServiceTypes } from '@/lib/publicData'
import { apiFetch, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { getServiceName } from '@/lib/i18nHelpers'
import { calculatePrice, formatUZS, REPAIR_TIER_MULTIPLIER, TIER_MULTIPLIER } from '@/lib/pricing'
import type { Addon, Booking as BookingRow, BookingFrequency, BookingTier, ServiceCategory, ServiceType } from '@/lib/types'

const TIERS: BookingTier[] = ['standard', 'premium', 'elite']
const CATEGORIES: ServiceCategory[] = ['cleaning', 'repair']

export const DRAFT_KEY = 'primestandard_booking_draft'

interface DraftForm {
  serviceId: string
  rooms: number
  areaSqm: string
  floor: string
  address: string
  city: string
  date: string
  time: string
  frequency: BookingFrequency
  tier: BookingTier
  addonCodes: string[]
  contactName: string
  contactPhone: string
  notes: string
}

const emptyForm: DraftForm = {
  serviceId: '',
  rooms: 1,
  areaSqm: '',
  floor: '',
  address: '',
  city: 'Toshkent',
  date: '',
  time: '10:00',
  frequency: 'once',
  tier: 'standard',
  addonCodes: [],
  contactName: '',
  contactPhone: '',
  notes: '',
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'

export default function Booking() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { t, lang } = useTranslation()

  const [services, setServices] = useState<ServiceType[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [form, setForm] = useState<DraftForm>(emptyForm)
  const [category, setCategory] = useState<ServiceCategory>('cleaning')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [serviceList, ad] = await Promise.all([fetchActiveServiceTypes(), fetchActiveAddons()])
        setServices(serviceList)
        setAddons(ad)

        const draftRaw = sessionStorage.getItem(DRAFT_KEY)
        if (draftRaw) {
          const draft: DraftForm = JSON.parse(draftRaw)
          setForm({ ...draft, floor: draft.floor ?? '' })
          const draftService = serviceList.find((s) => s.id === draft.serviceId)
          if (draftService) setCategory((draftService.category as ServiceCategory) ?? 'cleaning')
          sessionStorage.removeItem(DRAFT_KEY)
        } else {
          const firstCleaning = serviceList.find((s) => (s.category ?? 'cleaning') === 'cleaning')
          if (firstCleaning) setForm((f) => ({ ...f, serviceId: firstCleaning.id }))
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

  useEffect(() => {
    if (profile && !form.contactName) {
      setForm((f) => ({ ...f, contactName: profile.full_name ?? '', contactPhone: profile.phone ?? f.contactPhone }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const servicesInCategory = useMemo(
    () => services.filter((s) => (s.category ?? 'cleaning') === category),
    [services, category],
  )

  // Keep the selected service (and a couple of category-only settings) in
  // sync with the active category tab - if the user switches tabs and the
  // currently-selected service isn't in the new list, fall back to the
  // first service of that category. Renovation work is one-off (not a
  // recurring weekly/monthly visit like cleaning), so the frequency picker
  // makes no sense there - reset it to "once" whenever repair is selected.
  useEffect(() => {
    if (!services.length) return
    const stillValid = servicesInCategory.some((s) => s.id === form.serviceId)
    setForm((f) => ({
      ...f,
      ...(!stillValid && servicesInCategory[0] ? { serviceId: servicesInCategory[0].id } : {}),
      ...(category === 'repair' ? { frequency: 'once' as BookingFrequency } : {}),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, services])

  const selectedService = services.find((s) => s.id === form.serviceId)
  const selectedAddons = addons.filter((a) => form.addonCodes.includes(a.code))
  const showFloorInput = !!selectedService?.floor_multiplier
  const isRepair = category === 'repair'

  const priceBreakdown = useMemo(() => {
    if (!selectedService) return null
    return calculatePrice({
      service: selectedService,
      rooms: form.rooms,
      areaSqm: form.areaSqm ? Number(form.areaSqm) : null,
      selectedAddons,
      frequency: form.frequency,
      tier: form.tier,
      floor: form.floor ? Number(form.floor) : null,
    })
  }, [selectedService, form.rooms, form.areaSqm, form.floor, selectedAddons, form.frequency, form.tier])

  function updateField<K extends keyof DraftForm>(key: K, value: DraftForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleAddon(code: string) {
    setForm((f) => ({
      ...f,
      addonCodes: f.addonCodes.includes(code) ? f.addonCodes.filter((c) => c !== code) : [...f.addonCodes, code],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedService || !priceBreakdown) {
      setError(t('booking.selectServiceError'))
      return
    }
    if (!form.address || !form.date || !form.contactPhone) {
      setError(t('booking.requiredFieldsError'))
      return
    }

    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      navigate('/kirish', { state: { from: '/band-qilish', message: 'Buyurtmani yakunlash uchun tizimga kiring' } })
      return
    }

    setSubmitting(true)
    try {
      // Price is recomputed server-side from service_types/addons (never
      // trusts client-sent amounts) - see netlify/functions/bookings.ts.
      const data = await apiFetch<BookingRow>('bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          rooms: form.rooms,
          areaSqm: form.areaSqm ? Number(form.areaSqm) : null,
          floor: form.floor ? Number(form.floor) : null,
          address: form.address,
          city: form.city,
          date: form.date,
          time: form.time,
          frequency: form.frequency,
          tier: form.tier,
          addonCodes: form.addonCodes,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          notes: form.notes,
        }),
      })
      navigate(`/kabinet/buyurtma/${data.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('booking.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const tierLabels = (isRepair ? t('pricing.repairTierLabels') : t('pricing.tierLabels')) as Record<BookingTier, string>
  const tierPerks = (isRepair ? t('pricing.repairTierPerks') : t('pricing.tierPerks')) as Record<BookingTier, string[]>
  const tierMultiplierMap = isRepair ? REPAIR_TIER_MULTIPLIER : TIER_MULTIPLIER
  const frequencyLabels = t('pricing.frequencyLabels') as Record<BookingFrequency, string>

  if (loading) {
    return <div className="section py-20 text-center text-gray-400">{t('booking.loading')}</div>
  }

  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900">{t('booking.title')}</h1>
      <p className="mt-2 text-gray-500">{t('booking.subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <label className="label">{t('booking.categoryLabel')}</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    category === c ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c === 'cleaning' ? t('booking.categoryCleaning') : t('booking.categoryRepair')}
                </button>
              ))}
            </div>

            {isRepair && (
              <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">{t('booking.repairPromo')}</p>
            )}

            <label className="label mt-5">{t('booking.serviceType')}</label>
            {servicesInCategory.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                {t('booking.noServicesInCategory')}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {servicesInCategory.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => updateField('serviceId', s.id)}
                    className={`overflow-hidden rounded-lg border text-left transition ${
                      form.serviceId === s.id ? 'border-brand-600 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <div className="h-28 w-full overflow-hidden bg-gray-100">
                      <img src={s.image || FALLBACK_IMAGE} alt={getServiceName(s, lang)} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-gray-900">{getServiceName(s, lang)}</div>
                      <div className="mt-1 text-xs text-gray-500">{s.description_uz}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t('booking.propertyType')}</label>
              <input
                className="input bg-gray-50"
                disabled
                value={selectedService?.property_type === 'office' ? t('booking.office') : t('booking.home')}
              />
            </div>
            {selectedService?.pricing_unit === 'per_sqm' ? (
              <div>
                <label className="label">{t('booking.area')}</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.areaSqm}
                  onChange={(e) => updateField('areaSqm', e.target.value)}
                  required
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
                  value={form.rooms}
                  onChange={(e) => updateField('rooms', Number(e.target.value))}
                />
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
                  value={form.floor}
                  onChange={(e) => updateField('floor', e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-400">{t('booking.floorHelp')}</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label">{t('booking.address')}</label>
              <input
                className="input"
                placeholder={t('booking.addressPlaceholder')}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t('booking.city')}</label>
              <input className="input" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
            </div>
            {!isRepair && (
              <div>
                <label className="label">{t('booking.frequency')}</label>
                <select className="input" value={form.frequency} onChange={(e) => updateField('frequency', e.target.value as BookingFrequency)}>
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label as string}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">{t('booking.date')}</label>
              <input type="date" className="input" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => updateField('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">{t('booking.time')}</label>
              <input type="time" className="input" value={form.time} onChange={(e) => updateField('time', e.target.value)} required />
            </div>
          </div>

          <div className="card">
            <label className="label">{isRepair ? t('booking.repairTier') : t('booking.tier')}</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TIERS.map((tier) => {
                const pct = Math.round((tierMultiplierMap[tier] - 1) * 100)
                return (
                <button
                  type="button"
                  key={tier}
                  onClick={() => updateField('tier', tier)}
                  className={`rounded-md border p-4 text-left transition ${
                    form.tier === tier ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{tierLabels[tier]}</span>
                    {pct !== 0 && (
                      <span className={`tag px-2 py-0.5 text-[11px] text-white ${pct > 0 ? 'bg-brand-600' : 'bg-gray-400'}`}>
                        {pct > 0 ? '+' : ''}{pct}%
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-500">
                    {tierPerks[tier].map((perk) => (
                      <li key={perk} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
                )
              })}
            </div>
          </div>

          <div className="card">
            <label className="label">{t('booking.addonsLabel')}</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {addons.map((a) => (
                <label key={a.code} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={form.addonCodes.includes(a.code)} onChange={() => toggleAddon(a.code)} />
                    {a.name_uz}
                  </span>
                  <span className="text-gray-400">{formatUZS(a.price)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t('booking.nameLabel')}</label>
              <input className="input" value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)} required />
            </div>
            <div>
              <label className="label">{t('booking.phoneLabel')}</label>
              <input className="input" placeholder="+998 90 123 45 67" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('booking.notesLabel')}</label>
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-gray-900">{t('booking.priceDetailsTitle')}</h3>
            {priceBreakdown ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('booking.baseAmount')}</span>
                  <span>{formatUZS(priceBreakdown.baseAmount)}</span>
                </div>
                {priceBreakdown.tierAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{tierLabels[form.tier]}</span>
                    <span>+{formatUZS(priceBreakdown.tierAmount)}</span>
                  </div>
                )}
                {priceBreakdown.addonsAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('booking.addonsAmount')}</span>
                    <span>{formatUZS(priceBreakdown.addonsAmount)}</span>
                  </div>
                )}
                {priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-brand-700">
                    <span>{t('booking.discount')}</span>
                    <span>-{formatUZS(priceBreakdown.discountAmount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>{t('booking.total')}</span>
                  <span>{formatUZS(priceBreakdown.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">{t('booking.selectService')}</p>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
              {submitting ? t('booking.submitting') : user ? t('booking.submit') : t('booking.loginToContinue')}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">{t('booking.nextStepNote')}</p>
          </div>
        </div>
      </form>
    </div>
  )
}
