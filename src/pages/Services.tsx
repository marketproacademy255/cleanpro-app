import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveCleaners, fetchActiveServiceTypes } from '@/lib/publicData'
import { formatUZS } from '@/lib/pricing'
import type { Cleaner, ServiceType } from '@/lib/types'
import StarRating from '@/components/StarRating'

export default function Services() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [svc, staff] = await Promise.all([fetchActiveServiceTypes(), fetchActiveCleaners()])
        setServices(svc)
        setCleaners(staff)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklab bo'lmadi.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900">Xizmatlar va narxlar</h1>
      <p className="mt-2 max-w-2xl text-gray-500">
        Narxlarimiz AQSHdagi yetakchi tozalash platformalari (Merry Maids, Molly Maid, MaidPro) tuzilmasi asosida
        shakllantirilgan va O'zbekiston bozoriga moslashtirilgan. Aniq narx xona soni yoki maydonga qarab
        band qilish sahifasida avtomatik hisoblanadi.
      </p>

      {loading ? (
        <div className="mt-10 text-gray-400">Yuklanmoqda…</div>
      ) : error ? (
        <div className="mt-10 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{s.name_uz}</h3>
                <span className="tag bg-brand-50 text-brand-700">
                  {s.property_type === 'home' ? 'Uy' : 'Ofis'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{s.description_uz}</p>
              <div className="mt-4 text-2xl font-bold text-brand-700">
                {s.pricing_unit === 'per_sqm'
                  ? `${formatUZS(s.extra_unit_price)} / m²`
                  : formatUZS(s.base_price)}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  {s.pricing_unit === 'per_room' ? "boshlang'ich narx (1 xona)" : s.pricing_unit === 'per_sqm' ? '' : ''}
                </span>
              </div>
              {s.pricing_unit === 'per_room' && (
                <div className="mt-1 text-xs text-gray-400">
                  + {formatUZS(s.extra_unit_price)} har bir qo'shimcha xona uchun
                </div>
              )}
              {s.pricing_unit === 'per_sqm' && (
                <div className="mt-1 text-xs text-gray-400">min. {formatUZS(s.min_price)}</div>
              )}
              <Link to="/band-qilish" className="btn-primary mt-5 w-full">
                Ushbu xizmatni band qilish
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-16 text-2xl font-bold text-gray-900">Jamoamiz</h2>
      <p className="mt-2 text-gray-500">Har bir xizmatchimiz tekshirilgan va sinovdan o'tgan.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {cleaners.map((c) => (
          <div key={c.id} className="card text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {c.full_name.charAt(0)}
            </div>
            <div className="mt-3 font-semibold text-gray-900">{c.full_name}</div>
            <div className="mt-1 flex justify-center"><StarRating rating={c.rating} /></div>
            <div className="mt-2 text-xs text-gray-500">{c.years_experience} yil tajriba</div>
          </div>
        ))}
      </div>
    </div>
  )
}
