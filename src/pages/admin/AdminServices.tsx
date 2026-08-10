import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { formatUZS } from '@/lib/pricing'
import type { ServiceType } from '@/lib/types'

export default function AdminServices() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    const data = await apiFetch<ServiceType[]>('admin-services').catch(() => [])
    setServices(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function updateLocal(id: string, patch: Partial<ServiceType>) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  async function save(s: ServiceType) {
    setSavingId(s.id)
    await apiFetch(`admin-services?id=${s.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        base_price: s.base_price,
        extra_unit_price: s.extra_unit_price,
        min_price: s.min_price,
        multiplier: s.multiplier,
        is_active: s.is_active,
      }),
    }).catch(() => null)
    setSavingId(null)
  }

  if (loading) return <div className="text-gray-400">Yuklanmoqda…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Xizmatlar va narxlar</h1>
      <p className="mt-2 text-sm text-gray-500">
        Narxlarni istalgan vaqtda tahrirlashingiz mumkin — o'zgarishlar saytda darhol ko'rinadi.
      </p>

      <div className="mt-6 space-y-4">
        {services.map((s) => (
          <div key={s.id} className="card grid gap-4 sm:grid-cols-5 sm:items-end">
            <div className="sm:col-span-1">
              <div className="font-semibold text-gray-900">{s.name_uz}</div>
              <div className="text-xs text-gray-400">{s.pricing_unit}</div>
            </div>
            <div>
              <label className="label text-xs">Boshlang'ich narx</label>
              <input type="number" className="input" value={s.base_price} onChange={(e) => updateLocal(s.id, { base_price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label text-xs">
                {s.pricing_unit === 'per_sqm' ? 'Narx / m²' : "Qo'shimcha xona narxi"}
              </label>
              <input type="number" className="input" value={s.extra_unit_price} onChange={(e) => updateLocal(s.id, { extra_unit_price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label text-xs">Minimal narx</label>
              <input type="number" className="input" value={s.min_price} onChange={(e) => updateLocal(s.id, { min_price: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => save(s)} disabled={savingId === s.id} className="btn-primary py-2 text-sm">
                {savingId === s.id ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </div>
            <div className="sm:col-span-5 text-xs text-gray-400">
              Hozirgi ko'rinishi: {s.pricing_unit === 'per_sqm' ? `${formatUZS(s.extra_unit_price)} / m² (min ${formatUZS(s.min_price)})` : `${formatUZS(s.base_price)} + ${formatUZS(s.extra_unit_price)}/qo'shimcha xona`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
