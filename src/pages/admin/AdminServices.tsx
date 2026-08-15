import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/api'
import { formatUZS } from '@/lib/pricing'
import type { PricingUnit, PropertyType, ServiceType } from '@/lib/types'

const emptyForm = {
  code: '',
  name_uz: '',
  description_uz: '',
  property_type: 'home' as PropertyType,
  pricing_unit: 'per_room' as PricingUnit,
  base_price: 0,
  extra_unit_price: 0,
  min_price: 0,
  multiplier: 1,
  sort_order: 0,
}

export default function AdminServices() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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
        name_uz: s.name_uz,
        description_uz: s.description_uz,
        base_price: s.base_price,
        extra_unit_price: s.extra_unit_price,
        min_price: s.min_price,
        multiplier: s.multiplier,
        sort_order: s.sort_order,
        is_active: s.is_active,
      }),
    }).catch(() => null)
    setSavingId(null)
  }

  async function toggleActive(s: ServiceType) {
    updateLocal(s.id, { is_active: !s.is_active })
    await apiFetch(`admin-services?id=${s.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !s.is_active }),
    }).catch(() => null)
    load()
  }

  async function createService(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    if (!form.code || !form.name_uz) {
      setCreateError('code va nomi majburiy.')
      return
    }
    setCreating(true)
    try {
      await apiFetch('admin-services', { method: 'POST', body: JSON.stringify(form) })
      setForm(emptyForm)
      await load()
    } catch {
      setCreateError("Xizmat qo'shilmadi. Kodi allaqachon band bo'lishi mumkin.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="text-gray-400">Yuklanmoqda…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Xizmatlar va narxlar</h1>
      <p className="mt-2 text-sm text-gray-500">
        Narxlarni istalgan vaqtda tahrirlashingiz mumkin — o'zgarishlar saytda darhol ko'rinadi.
      </p>

      {services.length === 0 && (
        <div className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Hozircha bironta xizmat yo'q. Pastdagi shakl orqali birinchisini qo'shing — u darhol saytda ko'rinadi.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {services.map((s) => (
          <div key={s.id} className="card grid gap-4 sm:grid-cols-6 sm:items-end">
            <div className="sm:col-span-2">
              <label className="label text-xs">Nomi</label>
              <input className="input" value={s.name_uz} onChange={(e) => updateLocal(s.id, { name_uz: e.target.value })} />
              <div className="mt-1 text-xs text-gray-400">{s.code} · {s.pricing_unit}</div>
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
            <div className="sm:col-span-5">
              <label className="label text-xs">Tavsif</label>
              <input className="input" value={s.description_uz ?? ''} onChange={(e) => updateLocal(s.id, { description_uz: e.target.value })} />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => toggleActive(s)}
                className={`w-full rounded-lg py-2 text-xs font-semibold ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {s.is_active ? 'Faol' : 'Nofaol'}
              </button>
            </div>
            <div className="sm:col-span-6 text-xs text-gray-400">
              Hozirgi ko'rinishi: {s.pricing_unit === 'per_sqm' ? `${formatUZS(s.extra_unit_price)} / m² (min ${formatUZS(s.min_price)})` : `${formatUZS(s.base_price)} + ${formatUZS(s.extra_unit_price)}/qo'shimcha xona`}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-gray-900">Yangi xizmat qo'shish</h2>
      <form onSubmit={createService} className="card mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label text-xs">Kod (masalan: standard_home)</label>
          <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        </div>
        <div>
          <label className="label text-xs">Nomi</label>
          <input className="input" value={form.name_uz} onChange={(e) => setForm({ ...form, name_uz: e.target.value })} required />
        </div>
        <div>
          <label className="label text-xs">Mulk turi</label>
          <select className="input" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value as PropertyType })}>
            <option value="home">Uy / kvartira</option>
            <option value="office">Ofis</option>
          </select>
        </div>
        <div>
          <label className="label text-xs">Narxlash turi</label>
          <select className="input" value={form.pricing_unit} onChange={(e) => setForm({ ...form, pricing_unit: e.target.value as PricingUnit })}>
            <option value="per_room">Xona bo'yicha</option>
            <option value="per_sqm">m² bo'yicha</option>
            <option value="flat">Belgilangan narx</option>
          </select>
        </div>
        <div>
          <label className="label text-xs">Boshlang'ich narx</label>
          <input type="number" className="input" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label text-xs">Qo'shimcha birlik narxi</label>
          <input type="number" className="input" value={form.extra_unit_price} onChange={(e) => setForm({ ...form, extra_unit_price: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label text-xs">Minimal narx</label>
          <input type="number" className="input" value={form.min_price} onChange={(e) => setForm({ ...form, min_price: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label text-xs">Multiplikator</label>
          <input type="number" step="0.1" className="input" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label text-xs">Tartib raqami</label>
          <input type="number" className="input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        </div>
        <div className="sm:col-span-3">
          <label className="label text-xs">Tavsif</label>
          <input className="input" value={form.description_uz} onChange={(e) => setForm({ ...form, description_uz: e.target.value })} />
        </div>
        {createError && <p className="sm:col-span-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{createError}</p>}
        <div className="sm:col-span-3">
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Qo\'shilmoqda…' : "+ Xizmat qo'shish"}
          </button>
        </div>
      </form>
    </div>
  )
}
