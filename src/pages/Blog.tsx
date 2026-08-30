import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { blogPosts, getPostContent } from '@/lib/blogPosts'
import { useTranslation } from '@/context/LanguageContext'

const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', en: 'en-US', ru: 'ru-RU' }

export default function Blog() {
  const { t, lang } = useTranslation()

  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('blog.title')}</h1>
      <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">{t('blog.desc')}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {blogPosts.map((post) => {
          const content = getPostContent(post, lang)
          return (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-lg border border-gray-200 transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:hover:border-brand-700"
            >
              <div className="h-40 overflow-hidden">
                <img
                  src={post.image}
                  alt={content.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString(DATE_LOCALE[lang] ?? 'uz-UZ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readMinutes} {t('blog.readMinutes')}
                  </span>
                </div>
                <h2 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{content.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{content.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400">
                  {t('blog.read')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
