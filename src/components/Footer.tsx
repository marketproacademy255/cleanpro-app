import { Link } from 'react-router-dom'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { BRANCH_LOCATIONS, COMPANY_EMAIL, COMPANY_PHONE_DISPLAY, COMPANY_PHONE_TEL } from '@/lib/config'

export default function Footer() {
  const { t, lang } = useTranslation()
  const services: string[] = t('footer.services')

  return (
    <footer className="mt-24 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-[#0c1512]">
      <div className="section grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-700 dark:text-brand-400">
            <img src="/logo-emblem.png" alt={t('brand.name')} className="h-8 w-8 shrink-0 object-contain" />
            <span className="flex flex-col leading-tight">
              <span>{t('brand.name')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t('brand.tagline')}
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('footer.tagline')}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{t('footer.servicesTitle')}</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            {services.map((s) => (
              <li key={s}>
                <Link to="/services" className="hover:text-brand-700 dark:hover:text-brand-400">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{t('footer.companyTitle')}</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link to="/about" className="hover:text-brand-700 dark:hover:text-brand-400">{t('footer.about')}</Link></li>
            <li><Link to="/blog" className="hover:text-brand-700 dark:hover:text-brand-400">{t('footer.blog')}</Link></li>
            <li><Link to="/contact" className="hover:text-brand-700 dark:hover:text-brand-400">{t('footer.contact')}</Link></li>
            <li><Link to="/booking" className="hover:text-brand-700 dark:hover:text-brand-400">{t('footer.bookNow')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{t('footer.contactTitle')}</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <a href={`tel:${COMPANY_PHONE_TEL}`} className="flex items-center gap-2 hover:text-brand-700 dark:hover:text-brand-400 transition font-medium text-gray-900 dark:text-gray-100">
                <Phone className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                {COMPANY_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY_EMAIL}`} className="flex items-center gap-2 hover:text-brand-700 dark:hover:text-brand-400 transition">
                <Mail className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                {COMPANY_EMAIL}
              </a>
            </li>
            <li className="pt-1">
              <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                Filiallar xaritasi:
              </div>
              <div className="ml-5 mt-1 flex flex-col gap-1 text-xs">
                {BRANCH_LOCATIONS.map((b) => (
                  <a
                    key={b.id}
                    href={b.yandexMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <span>{lang === 'ru' ? b.name_ru : lang === 'en' ? b.name_en : b.name_uz}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </li>
          </ul>
          <div className="mt-3 flex gap-2">
            <span className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">Payme</span>
            <span className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">Click</span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 dark:border-gray-800">
        <div className="section flex flex-col items-center justify-between gap-2 text-xs text-gray-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-brand-700 dark:hover:text-brand-400">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-brand-700 dark:hover:text-brand-400">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
