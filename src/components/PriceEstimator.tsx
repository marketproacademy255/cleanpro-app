import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator } from 'lucide-react'
import { fetchActiveServiceTypes } from '@/lib/publicData'
import { calculatePrice, formatUZS } from '@/lib/pricing'
import { DRAFT_KEY } from '@/pages/Booking'
import type { ServiceType } from '@/lib/types'

/**
 * Quick, no-login price teaser for the Home page. Reuses the exact same
 * calculatePrice() logic as the real Booking page so the number shown here
 * always matches what a visitor will see when they continue - it's a
 * "standard" tier, one-off estimate only (no addons/frequency discount),
 * clearly labeled as approximate. The real, final price (with add-ons,
 * tariff and recurring discount) is always computed on the Booking page,
 * and re-verified server-side before payment.
 */
export default function PriceEstimator() {
  const navigate = useNavigate()
  const [services, setServices] = useState<ServiceType[]>([])
  const [serviceId, setServiceId] = useState('')
  const [rooms, setRooms] = useState(2)
  const [areaSqm, setAreaSqm] = useState(50)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveServiceTypes()
      .then((list) => {
        setServices(list)
        if (list[0]) setServiceId(list[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const selected = services.find((s) => s.id === serviceId)

  const estimate = useMemo(() => {
    if (!selected) return null
    return calculatePrice({
      service: selected,
      rooms,
      areaSqm,
      selectedAddons: [],
      frequency: 'once',
      tier: 'standard',
    })
  }, [selected, rooms, areaSqm])

  function continueToBooking() {
    if (!selected) {
      navigate('/band-qilish')
      return
    }
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        serviceId: selected.id,
        rooms,
        areaSqm: selected.pricing_unit === 'per_sqm' ? String(areaSqm) : '',
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
      }),
    )
    navigate('/band-qilish')
  }

  if (loading || services.length === 0) return null

  return (
    <div className="card">
      <div className="flex items-center gap-2 text-brand-700">
        <Calculator className="h-5 w-5" />
        <span className="text-sm font-semibold uppercase tracking-wide">Taxminiy narx</span>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Xizmat turi va o'lchamni tanlang — narxni bir zumda ko'ring.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Xizmat turi</label>
          <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_uz}
              </option>
            ))}
          </select>
        </div>
        {selected?.pricing_unit === 'per_sqm' ? (
          <div>
            <label className="label">Maydon (m²)</label>
            <input
              type="number"
              min={1}
              className="input"
              value={areaSqm}
              onChange={(e) => setAreaSqm(Number(e.target.value) || 0)}
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
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
        <div>
          <div className="text-xs text-gray-400">Taxminiy narx (standart tarif)</div>
          <div className="text-2xl font-bold text-gray-900">
            {estimate ? formatUZS(estimate.totalAmount) : '—'}
          </div>
        </div>
        <button type="button" onClick={continueToBooking} className="btn-primary w-full sm:w-auto">
          Band qilishni davom ettirish
        </button>
      </div>
    </div>
  )
}
