import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/api'
import { formatUZS } from '@/lib/pricing'
import type { Addon } from '@/lib/types'

const emptyForm = { code: '', name_uz: '', price: 0, sort_order: 0 }

export default function AdminAddons() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function load() {
    const data = await apiFetch<Addon[]>('admin-addons').catch(() => [])
    setAddons(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function updateLocal(id: string, patch: Partial<Addon>) {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  async function save(a: Addon) {
    setSavingId(a.id)
    await apiFetch(`admin-addons?id=${a.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name_uz: a.name_uz, price: a.price, sort_order: a.sort_order }),
    }).catch(() => null)
    setSavingId(null)
  }

  async function toggleActive(a: Addon) {
    updateLocal(a.id, { is_active: !a.is_active })
    await apiFetch(`admin-addons?id=${a.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !a.is_active }),
    }).catch(() => null)
    load()
  }

  async function createAddon(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    if (!form.code || !form.name_uz) {
      setCreateError('code va nomi majburiy.')
      return
    }
    setCreating(true)
    try {
      await apiFetch('admin-addons', { method: 'POST', body: JSON.stringify(form) })
      setForm(emptyForm)
      await load()
    } catch {
      setCreateError("Qo'shimcha xizmat qo'shilmadi. Kodi allaqachon band bo'lishi mumkin.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="text-gray-400">Yuklanmoqda…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Qo'shimcha xizmatlar</h1>
      <p className="mt-2 text-sm text-gray-500">
        Band qilish sahifasida mijozlar tanlashi mumkin bo'lgan qo'shimcha xizmatlar (masalan, muzlatgich ichkarisi,
        dazmollash).
      </p>

      {addons.length === 0 && (
        <div className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Hozircha bironta qo'shimcha xizmat yo'q. Pastdagi shakl orqali birinchisini qo'shing.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {addons.map((a) => (
          <div key={a.id} className="card grid gap-3 sm:grid-cols-5 sm:items-end">
            <div className="sm:col-span-2">
              <label className="label text-xs">Nomi</label>
              <input className="input" value={a.name_uz} onChange={(e) => updateLocal(a.id, { name_uz: e.target.value })} />
              <div className="mt-1 text-xs text-gray-400">{a.code}</div>
            </div>
            <div>
              <label className="label text-xs">Narxi</label>
              <input type="number" className="input" value={a.price} onChange={(e) => updateLocal(a.id, { price: Number(e.target.value) })} />
              <div className="mt-1 text-xs text-gray-400">{formatUZS(a.price)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => save(a)} disabled={savingId === a.id} className="btn-primary py-2 text-sm">
                {savingId === a.id ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => toggleActive(a)}
                className={`w-full rounded-lg py-2 text-xs font-semibold ${a.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {a.is_active ? 'Faol' : 'Nofaol'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-gray-900">Yangi qo'shimcha xizmat</h2>
      <form onSubmit={createAddon} className="card mt-4 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label text-xs">Kod (masalan: ironing)</label>
          <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        </div>
        <div>
          <label className="label text-xs">Nomi</label>
          <input className="input" value={form.name_uz} onChange={(e) => setForm({ ...form, name_uz: e.target.value })} required />
        </div>
        <div>
          <label className="label text-xs">Narxi</label>
          <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label text-xs">Tartib raqami</label>
          <input type="number" className="input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        </div>
        {createError && <p className="sm:col-span-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{createError}</p>}
        <div className="sm:col-span-4">
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? "Qo'shilmoqda…" : "+ Qo'shimcha xizmat qo'shish"}
          </button>
        </div>
      </form>
    </div>
  )
}
