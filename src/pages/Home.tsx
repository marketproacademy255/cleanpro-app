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
import DiscountBanner from '@/components/DiscountBanner'
import PriceEstimator from '@/components/PriceEstimator'
import Reveal from '@/components/Reveal'
import TeamPreview from '@/components/TeamPreview'
import { useTranslation } from '@/context/LanguageContext'

const TRUST_ICONS = [ShieldCheck, CreditCard, Zap, Sparkles]

export default function Home() {
  const { t } = useTranslation()

  const trustPoints: { label: string; desc: string }[] = t('home.trustPoints')
  const steps: { title: string; desc: string }[] = t('home.steps')
  const serviceTiles: { title: string; desc: string; img: string }[] = t('home.serviceTiles')
  const whyUs: string[] = t('home.whyUs')
  const faqs: { q: string; a: string }[] = t('home.faqs')

  const galleryPhotos = [
    'https://images.unsplash.com/photo-1647381518264-97ff1835026f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1742483359033-13315b247c74?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
  ]

  return (
    <div>
      <DiscountBanner />

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

        <div className="section relative max-w-2xl py-20 md:py-28">
          <span className="tag bg-white/10 text-white">{t('home.heroTag')}</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            {t('home.heroTitle')} <span className="text-brand-100">{t('home.heroTitleHighlight')}</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/80">{t('home.heroDesc')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/band-qilish"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 font-semibold tracking-tight text-brand-700 transition hover:bg-brand-50"
            >
              {t('home.ctaBook')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/xizmatlar"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-5 py-3 font-semibold tracking-tight text-white transition hover:bg-white/10"
            >
              {t('home.ctaPrices')}
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t('home.heroTrust1')}
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('home.heroTrust2')}
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('home.heroTrust3')}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-gray-100 bg-white py-10 dark:border-gray-800 dark:bg-[#0c1512]">
        <div className="section grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((t2, i) => {
            const Icon = TRUST_ICONS[i] ?? ShieldCheck
            return (
              <div key={t2.label} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{t2.label}</div>
                  <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t2.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.howTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.howDesc')}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instant price estimate */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section max-w-2xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.estimateTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.estimateDesc')}</p>
          <div className="mt-8">
            <PriceEstimator />
          </div>
        </div>
      </section>

      {/* Service tiles */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.servicesTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.servicesDesc')}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTiles.map((tile, i) => (
              <Reveal key={tile.title} delayMs={i * 100}>
                <Link
                  to="/xizmatlar"
                  className="group block h-full overflow-hidden rounded-lg border border-gray-200 transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:hover:border-brand-700"
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={tile.img}
                      alt={tile.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{tile.title}</div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tile.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400">
                      {t('home.detail')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section grid items-center gap-12 md:grid-cols-2">
          <Reveal direction="left" className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <img
              src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80"
              alt="Tozalangan yorug' xona"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Reveal>
          <Reveal direction="right">
            <span className="tag bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">{t('home.whyTag')}</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.whyTitle')}</h2>
            <ul className="mt-6 space-y-4">
              {whyUs.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span className="text-gray-600 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <TeamPreview />

      {/* Gallery */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.galleryTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.galleryDesc')}</p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {galleryPhotos.map((src, i) => (
              <Reveal key={src} delayMs={i * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  <img
                    src={src}
                    alt="Toza va tartibli xona"
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section max-w-3xl">
          <div className="flex items-center justify-center gap-2 text-brand-700 dark:text-brand-400">
            <MessageCircleQuestion className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">{t('home.faqTag')}</span>
          </div>
          <h2 className="mt-2 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.faqTitle')}</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="card group cursor-pointer">
                <summary className="flex list-none items-center justify-between font-semibold text-gray-900 marker:content-none dark:text-gray-100">
                  {f.q}
                  <span className="ml-4 shrink-0 text-brand-600 transition group-open:rotate-45 dark:text-brand-400">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section py-16">
        <div className="card flex flex-col items-center justify-between gap-6 border-brand-700 bg-brand-700 text-center text-white md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-bold">{t('home.ctaTitle')}</h3>
            <p className="mt-1 text-white/80">{t('home.ctaDesc')}</p>
          </div>
          <Link
            to="/band-qilish"
            className="rounded-md bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>
    </div>
  )
}
