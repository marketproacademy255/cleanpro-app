import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { getBlogPost, getPostContent } from '@/lib/blogPosts'
import { useTranslation } from '@/context/LanguageContext'

const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', en: 'en-US', ru: 'ru-RU' }

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getBlogPost(slug) : undefined
  const { t, lang } = useTranslation()

  if (!post) return <Navigate to="/blog" replace />

  const content = getPostContent(post, lang)

  return (
    <div>
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img src={post.image} alt={content.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/20 to-transparent" />
      </div>

      <div className="section max-w-2xl py-14">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('blog.allPosts')}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">{content.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(post.date).toLocaleDateString(DATE_LOCALE[lang] ?? 'uz-UZ')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readMinutes} {t('blog.readMinutes')}
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {content.paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-gray-700 dark:text-gray-300">
              {p}
            </p>
          ))}
        </div>

        <div className="card mt-10 flex flex-col items-center justify-between gap-4 border-brand-700 bg-brand-700 text-center text-white sm:flex-row sm:text-left">
          <div>
            <h3 className="text-lg font-bold">{t('blog.ctaTitle')}</h3>
            <p className="mt-1 text-sm text-white/80">{t('blog.ctaDesc')}</p>
          </div>
          <Link to="/booking" className="rounded-md bg-white px-5 py-2.5 font-semibold text-brand-700 transition hover:bg-brand-50">
            {t('blog.ctaButton')}
          </Link>
        </div>
      </div>
    </div>
  )
}
