import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { fetchActiveAddons, fetchActiveServiceTypes } from '@/lib/publicData'
import { apiFetch, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { calculatePrice, formatUZS, FREQUENCY_LABEL_UZ, TIER_LABEL_UZ, TIER_MULTIPLIER, TIER_PERKS_UZ } from '@/lib/pricing'
import type { Addon, Booking as BookingRow, BookingFrequency, BookingTier, ServiceType } from '@/lib/types'

const TIERS: BookingTier[] = ['standard', 'premium', 'elite']

export const DRAFT_KEY = 'cleanpro_booking_draft'

interface DraftForm {
  serviceId: string
  rooms: number
  areaSqm: string
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

export default function Booking() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [services, setServices] = useState<ServiceType[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [form, setForm] = useState<DraftForm>(emptyForm)
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
          setForm(JSON.parse(draftRaw))
          sessionStorage.removeItem(DRAFT_KEY)
        } else if (serviceList[0]) {
          setForm((f) => ({ ...f, serviceId: serviceList[0].id }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklab bo'lmadi. Qaytadan urinib ko'ring.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (profile && !form.contactName) {
      setForm((f) => ({ ...f, contactName: profile.full_name ?? '', contactPhone: profile.phone ?? f.contactPhone }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const selectedService = services.find((s) => s.id === form.serviceId)
  const selectedAddons = addons.filter((a) => form.addonCodes.includes(a.code))

  const priceBreakdown = useMemo(() => {
    if (!selectedService) return null
    return calculatePrice({
      service: selectedService,
      rooms: form.rooms,
      areaSqm: form.areaSqm ? Number(form.areaSqm) : null,
      selectedAddons,
      frequency: form.frequency,
      tier: form.tier,
    })
  }, [selectedService, form.rooms, form.areaSqm, selectedAddons, form.frequency, form.tier])

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
      setError('Xizmat turini tanlang.')
      return
    }
    if (!form.address || !form.date || !form.contactPhone) {
      setError("Iltimos, manzil, sana va telefon raqamini to'ldiring.")
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
      setError(err instanceof ApiError ? err.message : "Buyurtma yuborilmadi. Qaytadan urinib ko'ring.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="section py-20 text-center text-gray-400">Yuklanmoqda…</div>
  }

  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900">Tozalash xizmatini band qilish</h1>
      <p className="mt-2 text-gray-500">Ma'lumotlarni to'ldiring — narx pastda avtomatik hisoblanadi.</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <label className="label">Xizmat turi</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => updateField('serviceId', s.id)}
                  className={`rounded-md border p-4 text-left transition ${
                    form.serviceId === s.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{s.name_uz}</div>
                  <div className="mt-1 text-xs text-gray-500">{s.description_uz}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Mulk turi</label>
              <input className="input bg-gray-50" disabled value={selectedService?.property_type === 'office' ? 'Ofis' : 'Uy / kvartira'} />
            </div>
            {selectedService?.pricing_unit === 'per_sqm' ? (
              <div>
                <label className="label">Maydon (m²)</label>
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
                <label className="label">Xonalar soni</label>
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
            <div className="sm:col-span-2">
              <label className="label">Manzil</label>
              <input
                className="input"
                placeholder="Ko'cha, uy, kvartira raqami"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Shahar</label>
              <input className="input" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Chastota</label>
              <select className="input" value={form.frequency} onChange={(e) => updateField('frequency', e.target.value as BookingFrequency)}>
                {Object.entries(FREQUENCY_LABEL_UZ).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sana</label>
              <input type="date" className="input" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => updateField('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Vaqt</label>
              <input type="time" className="input" value={form.time} onChange={(e) => updateField('time', e.target.value)} required />
            </div>
          </div>

          <div className="card">
            <label className="label">Tarif</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TIERS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => updateField('tier', t)}
                  className={`rounded-md border p-4 text-left transition ${
                    form.tier === t ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{TIER_LABEL_UZ[t]}</span>
                    {t !== 'standard' && (
                      <span className="tag bg-brand-600 px-2 py-0.5 text-[11px] text-white">
                        +{Math.round((TIER_MULTIPLIER[t] - 1) * 100)}%
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-500">
                    {TIER_PERKS_UZ[t].map((perk) => (
                      <li key={perk} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="label">Qo'shimcha xizmatlar</label>
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
              <label className="label">Ism</label>
              <input className="input" value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)} required />
            </div>
            <div>
              <label className="label">Telefon raqam</label>
              <input className="input" placeholder="+998 90 123 45 67" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Qo'shimcha izoh (ixtiyoriy)</label>
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-gray-900">Narx tafsiloti</h3>
            {priceBreakdown ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Asosiy narx</span>
                  <span>{formatUZS(priceBreakdown.baseAmount)}</span>
                </div>
                {priceBreakdown.tierAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{TIER_LABEL_UZ[form.tier]} tarifi</span>
                    <span>+{formatUZS(priceBreakdown.tierAmount)}</span>
                  </div>
                )}
                {priceBreakdown.addonsAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Qo'shimcha xizmatlar</span>
                    <span>{formatUZS(priceBreakdown.addonsAmount)}</span>
                  </div>
                )}
                {priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-brand-700">
                    <span>Chegirma</span>
                    <span>-{formatUZS(priceBreakdown.discountAmount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Jami</span>
                  <span>{formatUZS(priceBreakdown.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">Xizmat turini tanlang</p>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
              {submitting ? 'Yuborilmoqda…' : user ? 'Buyurtmani tasdiqlash' : 'Davom etish uchun kiring'}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">
              Keyingi bosqichda Payme yoki Click orqali onlayn to'lov qilasiz.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
