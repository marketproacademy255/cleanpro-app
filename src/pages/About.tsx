import { CheckCircle2, CreditCard, Leaf, ShieldCheck } from 'lucide-react'

const pillars = [
  { icon: ShieldCheck, title: 'Tekshirilgan xizmatchilar', desc: 'Har bir xizmatchi shaxsan suhbatdan o\'tadi' },
  { icon: CreditCard, title: "Xavfsiz to'lov", desc: 'Payme, Click yoki chek orqali' },
  { icon: Leaf, title: 'Ekologik vositalar', desc: "Sog'liq uchun xavfsiz tozalash kimyoviy vositalari" },
]

const reasons = [
  "Barcha xizmatchilar ishga qabul qilinishdan oldin sinovdan o'tadi",
  "Payme va Click orqali xavfsiz onlayn to'lov",
  "Shaffof narxlash — yashirin to'lovlar yo'q",
  "Ekologik va xavfsiz tozalash vositalari",
]

export default function About() {
  return (
    <div className="section max-w-3xl py-14">
      <h1 className="text-3xl font-bold text-gray-900">Biz haqimizda</h1>
      <p className="mt-4 text-gray-600">
        CleanPro — Toshkentda faoliyat yurituvchi zamonaviy tozalash xizmati. Maqsadimiz uy va ofislarni
        onlayn bir necha bosim bilan, tekshirilgan xizmatchilar yordamida va xavfsiz onlayn to'lov orqali
        tozalatish imkonini berish.
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200">
        <img
          src="https://images.unsplash.com/photo-1713110824336-f78c320dcf8e?auto=format&fit=crop&w=1200&q=80"
          alt="Xizmatchi mebelni tozalamoqda"
          className="h-64 w-full object-cover sm:h-80"
          loading="lazy"
        />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.title} className="card text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-brand-50 text-brand-700">
              <p.icon className="h-6 w-6" />
            </span>
            <div className="mt-3 text-sm font-semibold text-gray-900">{p.title}</div>
            <div className="mt-1 text-xs text-gray-500">{p.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold text-gray-900">Nega aynan biz?</h2>
      <ul className="mt-4 space-y-3 text-gray-600">
        {reasons.map((r) => (
          <li key={r} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}
