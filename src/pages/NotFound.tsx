import { Link } from 'react-router-dom'
import { useTranslation } from '@/context/LanguageContext'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl font-extrabold text-brand-600 dark:text-brand-400">404</div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">{t('notFound.text')}</p>
      <Link to="/" className="btn-primary mt-6">{t('notFound.backHome')}</Link>
    </div>
  )
}
