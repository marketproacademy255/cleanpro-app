export default function About() {
  return (
    <div className="section max-w-3xl py-14">
      <h1 className="text-3xl font-bold text-gray-900">Biz haqimizda</h1>
      <p className="mt-4 text-gray-600">
        CleanPro — Toshkentda faoliyat yurituvchi zamonaviy tozalash xizmati. Maqsadimiz uy va ofislarni
        onlayn bir necha bosim bilan, tekshirilgan xizmatchilar yordamida va xavfsiz onlayn to'lov orqali
        tozalatish imkonini berish.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="card text-center">
          <div className="text-3xl font-extrabold text-brand-700">2,400+</div>
          <div className="mt-1 text-sm text-gray-500">Bajarilgan buyurtma</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-extrabold text-brand-700">30+</div>
          <div className="mt-1 text-sm text-gray-500">Tajribali xizmatchi</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-extrabold text-brand-700">4.9/5</div>
          <div className="mt-1 text-sm text-gray-500">O'rtacha reyting</div>
        </div>
      </div>
      <h2 className="mt-12 text-xl font-bold text-gray-900">Nega aynan biz?</h2>
      <ul className="mt-4 space-y-2 text-gray-600">
        <li>• Barcha xizmatchilar sinovdan o'tgan va sug'urtalangan</li>
        <li>• Payme va Click orqali xavfsiz onlayn to'lov</li>
        <li>• Shaffof narxlash — yashirin to'lovlar yo'q</li>
        <li>• Ekologik va xavfsiz tozalash vositalari</li>
      </ul>
    </div>
  )
}
