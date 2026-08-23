import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-gray-100 bg-white">
      <div className="section grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-700">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">CP</span>
            CleanPro
          </div>
          <p className="text-sm text-gray-500">
            Uy va ofislaringiz uchun ishonchli, tez va sifatli tozalash xizmati. Onlayn band qiling — Payme yoki
            Click orqali xavfsiz to'lang.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Xizmatlar</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/xizmatlar" className="hover:text-brand-700">Standart tozalash</Link></li>
            <li><Link to="/xizmatlar" className="hover:text-brand-700">Chuqur tozalash</Link></li>
            <li><Link to="/xizmatlar" className="hover:text-brand-700">Ko'chishdan oldin/keyin</Link></li>
            <li><Link to="/xizmatlar" className="hover:text-brand-700">Ofis tozalash</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Kompaniya</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/biz-haqimizda" className="hover:text-brand-700">Biz haqimizda</Link></li>
            <li><Link to="/maslahatlar" className="hover:text-brand-700">Maslahatlar</Link></li>
            <li><Link to="/aloqa" className="hover:text-brand-700">Aloqa</Link></li>
            <li><Link to="/band-qilish" className="hover:text-brand-700">Buyurtma berish</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Aloqa</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              +998 90 111 22 33
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              info@cleanpro.uz
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              Toshkent, O'zbekiston
            </li>
          </ul>
          <div className="mt-3 flex gap-2">
            <span className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500">Payme</span>
            <span className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500">Click</span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4">
        <div className="section flex flex-col items-center justify-between gap-2 text-xs text-gray-400 sm:flex-row">
          <span>© {new Date().getFullYear()} CleanPro. Barcha huquqlar himoyalangan.</span>
          <div className="flex gap-4">
            <Link to="/maxfiylik" className="hover:text-brand-700">Maxfiylik siyosati</Link>
            <Link to="/foydalanish-shartlari" className="hover:text-brand-700">Foydalanish shartlari</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
