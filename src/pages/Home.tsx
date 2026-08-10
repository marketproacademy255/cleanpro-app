import { Link } from 'react-router-dom'

const steps = [
  { title: '1. Xizmatni tanlang', desc: "Uy yoki ofis, tozalash turi va qo'shimcha xizmatlarni belgilang." },
  { title: '2. Vaqtni band qiling', desc: 'Sizga qulay sana va soatni tanlang — bir martalik yoki muntazam.' },
  { title: '3. Onlayn to\'lang', desc: "Payme yoki Click orqali xavfsiz to'lov qiling, xizmatchi tayinlanadi." },
]

const features = [
  { icon: '✅', title: "Tekshirilgan xizmatchilar", desc: "Barcha xizmatchilarimiz sinovdan o'tgan va tajribali." },
  { icon: '💳', title: "Payme va Click", desc: "Naqd pulsiz, xavfsiz onlayn to'lov tizimlari." },
  { icon: '🕐', title: "Vaqtga aniq", desc: "Belgilangan vaqtda, sifatli va tez xizmat." },
  { icon: '🌿', title: "Ekologik vositalar", desc: "Sog'liq uchun xavfsiz tozalash vositalari." },
]

export default function Home() {
  return (
    <div>
      <section className="section grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Toshkentdagi #1 tozalash xizmati
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
            Uyingiz yoki ofisingiz uchun <span className="text-brand-600">professional tozalash</span> — bir necha
            bosim bilan
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            Onlayn band qiling, Payme yoki Click orqali to'lang va tekshirilgan xizmatchimiz eshigingizga keladi.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/band-qilish" className="btn-primary">
              Hoziroq band qilish
            </Link>
            <Link to="/xizmatlar" className="btn-secondary">
              Narxlarni ko'rish
            </Link>
          </div>
          <div className="mt-8 flex gap-8 text-sm text-gray-500">
            <div><span className="block text-2xl font-bold text-gray-900">2,400+</span>bajarilgan buyurtma</div>
            <div><span className="block text-2xl font-bold text-gray-900">4.9/5</span>mijozlar reytingi</div>
            <div><span className="block text-2xl font-bold text-gray-900">30+</span>tajribali xizmatchi</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-brand-50 to-white">
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="text-2xl">{f.icon}</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{f.title}</div>
                <div className="mt-1 text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="section py-16">
        <div className="card flex flex-col items-center justify-between gap-6 bg-brand-600 text-center text-white md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-bold">Bugun tozalash xizmatini band qiling</h3>
            <p className="mt-1 text-brand-50">Narxni bir necha soniyada hisoblang va onlayn to'lang.</p>
          </div>
          <Link to="/band-qilish" className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">
            Buyurtma berish
          </Link>
        </div>
      </section>
    </div>
  )
}
