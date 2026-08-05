import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import StarRating from '@/components/StarRating'
import type { Cleaner } from '@/lib/types'

const emptyForm = { full_name: '', phone: '', bio: '', years_experience: 0 }

export default function AdminStaff() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('cleaners').select('*').order('created_at', { ascending: false })
    setCleaners((data as Cleaner[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addCleaner(e: FormEvent) {
    e.preventDefault()
    if (!form.full_name) return
    setSaving(true)
    await supabase.from('cleaners').insert({ ...form, is_active: true, rating: 5.0 })
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  async function toggleActive(c: Cleaner) {
    await supabase.from('cleaners').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Xizmatchilar</h1>

      <form onSubmit={addCleaner} className="card mt-6 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Ism familiya</label>
          <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Tajriba (yil)</label>
          <input type="number" min={0} className="input" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Qisqacha ma'lumot</label>
          <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saqlanmoqda…' : "+ Xizmatchi qo'shish"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="mt-8 text-gray-400">Yuklanmoqda…</div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cleaners.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{c.full_name}</div>
                  <div className="text-xs text-gray-400">{c.phone}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${c.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.is_active ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              <div className="mt-2"><StarRating rating={c.rating} /></div>
              <p className="mt-2 text-xs text-gray-500">{c.bio}</p>
              <button onClick={() => toggleActive(c)} className="btn-secondary mt-4 w-full py-2 text-xs">
                {c.is_active ? "Nofaol qilish" : 'Faollashtirish'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
