import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/api'
import { triggerHaptic } from '@/lib/haptics'
import StarRating from '@/components/StarRating'
import { SkeletonRow } from '@/components/SkeletonLoaders'
import type { Review } from '@/lib/types'

const emptyForm = { customer_name: '', rating: 5, comment: '' }

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function load() {
    const rows = await apiFetch<Review[]>('admin-reviews').catch(() => [])
    setReviews(rows)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.customer_name || !form.comment) return
    setSubmitting(true)
    setErrorMsg(null)
    triggerHaptic('medium')
    try {
      await apiFetch('admin-reviews', { method: 'POST', body: JSON.stringify(form) })
      triggerHaptic('success')
      setForm(emptyForm)
      load()
    } catch {
      triggerHaptic('error')
      setErrorMsg("Sharh saqlanmadi. Qayta urinib ko'ring.")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleApproved(r: Review) {
    const previous = [...reviews]
    // Optimistic state update
    setReviews((prev) =>
      prev.map((item) => (item.id === r.id ? { ...item, is_approved: !item.is_approved } : item))
    )
    triggerHaptic('light')
    try {
      await apiFetch(`admin-reviews?id=${r.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_approved: !r.is_approved }),
      })
    } catch {
      // Rollback on error
      triggerHaptic('error')
      setReviews(previous)
      setErrorMsg("O'zgarish saqlanmadi. Orqaga qaytarildi.")
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Sharhni o'chirishni tasdiqlaysizmi?")) return
    const previous = [...reviews]
    // Optimistic deletion
    setReviews((prev) => prev.filter((item) => item.id !== id))
    triggerHaptic('medium')
    try {
      await apiFetch(`admin-reviews?id=${id}`, { method: 'DELETE' })
    } catch {
      // Rollback on error
      triggerHaptic('error')
      setReviews(previous)
      setErrorMsg("O'chirishda xatolik yuz berdi. Sharh qaytarildi.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sharhlar</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Haqiqiy mijozlardan qo'lda so'rab olingan sharhlarni shu yerga qo'shing. Tasdiqlangan (Faol) sharhlar Bosh
        sahifadagi umumiy reyting va sharh kartalarida ko'rinadi.
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Mijoz ismi</label>
          <input
            className="input"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">Reyting</label>
          <select
            className="input"
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Sharh matni</label>
          <textarea
            className="input"
            rows={3}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Yuborilmoqda…' : "Sharh qo'shish"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {reviews.length === 0 && <p className="text-sm text-gray-400">Hozircha sharhlar yo'q.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{r.customer_name}</span>
                <StarRating rating={r.rating} />
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.is_approved ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                {r.is_approved ? 'Faol' : 'Yashirin'}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => toggleApproved(r)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {r.is_approved ? 'Yashirish' : 'Faollashtirish'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

