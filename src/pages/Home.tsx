import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

const steps = [
  { title: '1. Xizmatni tanlang', desc: "Uy yoki ofis, tozalash turi va qo'shimcha xizmatlarni belgilang." },
  { title: '2. Vaqtni band qiling', desc: 'Sizga qulay sana va soatni tanlang — bir martalik yoki muntazam.' },
  { title: '3. Onlayn to\'lang', desc: "Payme yoki Click orqali xavfsiz to'lov qiling, xizmatchi tayinlanadi." },
]

const trustPoints = [
  { icon: ShieldCheck, label: 'Tekshirilgan xizmatchilar', desc: 'Har biri shaxsan suhbatdan o\'tgan' },
  { icon: CreditCard, label: 'Xavfsiz onlayn to\'lov', desc: "Payme va Click orqali" },
  { icon: Zap, label: 'Tez javob', desc: "So'rovga bir necha daqiqada javob" },
  { icon: Sparkles, label: 'Shaffof narx', desc: "Yashirin to'lovlarsiz, oldindan aniq" },
]

const whyUs = [
  "Har bir xizmatchi ro'yxatga olinishdan oldin shaxsan suhbatdan o'tadi va tajribasi tekshiriladi",
  "Narx band qilishdan oldin aniq hisoblanadi — xona soni yoki maydonga qarab, yashirin qo'shimchalarsiz",
  "To'lov faqat tasdiqlangan xavfsiz kanallar — Payme va Click orqali amalga oshiriladi",
  "Har bir buyurtma holati shaxsiy kabinetingizda real vaqtda kuzatiladi",
]

const faqs = [
  {
    q: 'Xizmatchilar qanday tekshiriladi?',
    a: "Har bir xizmatchi ishga qabul qilinishdan oldin shaxsan suhbatdan o'tadi, tajribasi va tavsiyalari tekshiriladi. Profilida tajriba yili va mijozlar bahosi ko'rsatiladi.",
  },
  {
    q: "To'lovni qachon amalga oshiraman?",
    a: "Buyurtmani tasdiqlaganingizdan so'ng, Payme yoki Click orqali onlayn to'lov qilasiz. To'lov xizmatchi tayinlangandan keyin, xizmat ko'rsatilishidan oldin amalga oshiriladi.",
  },
  {
    q: "Agar natijadan qoniqmasam nima qilishim kerak?",
    a: "Aloqa sahifasi orqali yoki telefon raqamimiz bilan biz bilan bog'laning — muammoni tezkor hal qilishga harakat qilamiz.",
  },
  {
    q: 'Buyurtmani bekor qilish yoki ko\'chirish mumkinmi?',
    a: "Ha, shaxsiy kabinetingizdan buyurtma sanasini bekor qilish yoki o'zgartirish so'rovini yuborishingiz mumkin.",
  },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1647381518264-97ff1835026f?auto=format&fit=crop&w=1800&q=80"
            alt="Xizmatchi uyni tozalamoqda"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-900/50" />
        </div>

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
              <div className="border-b border-gray-100 pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Buyurtma xulosasi
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

      {/* Trust bar */}
      <section className="border-b border-gray-100 bg-white py-10">
        <div className="section grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((t) => (
            <div key={t.label} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
                <t.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-gray-900">{t.label}</div>
                <div className="mt-0.5 text-sm text-gray-500">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
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

      {/* Why us */}
      <section className="bg-white py-16">
        <div className="section grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80"
              alt="Tozalangan yorug' xona"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <span className="tag bg-brand-50 text-brand-700">Nega CleanPro</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Ishonchli, shaffof va qulay</h2>
            <ul className="mt-6 space-y-4">
              {whyUs.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="section max-w-3xl">
          <div className="flex items-center justify-center gap-2 text-brand-700">
            <MessageCircleQuestion className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Savol-javob</span>
          </div>
          <h2 className="mt-2 text-center text-3xl font-bold text-gray-900">Ko'p so'raladigan savollar</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="card group cursor-pointer">
                <summary className="flex list-none items-center justify-between font-semibold text-gray-900 marker:content-none">
                  {f.q}
                  <span className="ml-4 shrink-0 text-brand-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-500">{f.a}</p>
              </details>
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
