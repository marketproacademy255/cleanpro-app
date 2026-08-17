import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Zap } from 'lucide-react'

const steps = [
  { title: '1. Xizmatni tanlang', desc: "Uy yoki ofis, tozalash turi va qo'shimcha xizmatlarni belgilang." },
  { title: '2. Vaqtni band qiling', desc: 'Sizga qulay sana va soatni tanlang — bir martalik yoki muntazam.' },
  { title: '3. Onlayn to\'lang', desc: "Payme yoki Click orqali xavfsiz to'lov qiling, xizmatchi tayinlanadi." },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="section relative grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="tag bg-white/10 text-white">Toshkentdagi tozalash xizmati</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Uyingiz yoki ofisingiz uchun{' '}
              <span className="text-brand-100">professional tozalash</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              Onlayn band qiling, Payme yoki Click orqali xavfsiz to'lang va tekshirilgan xizmatchimiz
              eshigingizga keladi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/band-qilish"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 font-semibold tracking-tight text-brand-700 transition hover:bg-brand-50"
              >
                Hoziroq band qilish
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/xizmatlar"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-5 py-3 font-semibold tracking-tight text-white transition hover:bg-white/10"
              >
                Narxlarni ko'rish
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Tekshirilgan xizmatchilar
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Xavfsiz onlayn to'lov
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tez javob beramiz
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <span className="ml-2 text-xs font-medium text-gray-400">Buyurtma xulosasi</span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Xizmat</span>
                  <span className="font-semibold text-gray-900">Uy tozalash — Premium</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Manzil</span>
                  <span className="font-medium text-gray-900">Chilonzor, Toshkent</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Sana</span>
                  <span className="font-medium text-gray-900">18-avgust, 14:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Holat</span>
                  <span className="tag bg-green-50 text-green-700">Tasdiqlangan</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <div className="text-xs text-gray-400">Jami summa</div>
                  <div className="text-lg font-bold text-gray-900">285 000 so'm</div>
                </div>
                <span className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                  To'landi
                </span>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-3 shadow-lg sm:flex">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <div className="text-xs font-semibold text-gray-900">Xizmatchi tayinlandi</div>
                <div className="text-[11px] text-gray-500">5 daqiqada tasdiqlandi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="section">
          <h2 className="text-center text-3xl font-bold text-gray-900">Qanday ishlaydi</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500">
            Uch oddiy qadamda uyingiz yoki ofisingizni tozalatib oling.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="card">
                <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section py-16">
        <div className="card flex flex-col items-center justify-between gap-6 border-brand-700 bg-brand-700 text-center text-white md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-bold">Bugun tozalash xizmatini band qiling</h3>
            <p className="mt-1 text-white/80">Narxni bir necha soniyada hisoblang va onlayn to'lang.</p>
          </div>
          <Link
            to="/band-qilish"
            className="rounded-md bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Buyurtma berish
          </Link>
        </div>
      </section>
    </div>
  )
}
