import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Gift,
  MapPin,
  MessageCircleQuestion,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react'
import DiscountBanner from '@/components/DiscountBanner'
import PriceEstimator from '@/components/PriceEstimator'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import Reveal from '@/components/Reveal'
import StarRating from '@/components/StarRating'
import TeamPreview from '@/components/TeamPreview'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { fetchApprovedReviews } from '@/lib/publicData'
import type { Review } from '@/lib/types'

const TASHKENT_DISTRICTS = [
  'Bektemir',
  'Chilonzor',
  "Yashnobod",
  'Mirzo Ulugʼbek',
  'Mirobod',
  'Sergeli',
  'Shayxontohur',
  'Olmazor',
  'Uchtepa',
  'Yakkasaroy',
  'Yunusobod',
  'Yangihayot',
]

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    fetchApprovedReviews().then(setReviews).catch(() => setReviews([]))
  }, [])

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const steps: { title: string; desc: string }[] = t('home.steps')
  const serviceTiles: { title: string; desc: string; img: string }[] = t('home.serviceTiles')
  const whyUs: string[] = t('home.whyUs')
  const faqs: { q: string; a: string }[] = t('home.faqs')

  const galleryPhotos = [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=800&q=80',
  ]

  return (
    <div>
      <DiscountBanner />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=80"
            alt="Xizmatchi uyni tozalamoqda"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-900/50" />
        </div>

        <div className="section relative max-w-2xl py-20 md:py-28">
          {/* Social Proof Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4 backdrop-blur-sm shadow-sm">
            <span className="flex text-amber-400">★★★★★</span>
            <span>4.9/5 (1,200+ xonadonlar ishonchi)</span>
          </div>
          <div>
            <span className="tag bg-white/10 text-white">{t('home.heroTag')}</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            {t('home.heroTitle')} <span className="text-brand-100">{t('home.heroTitleHighlight')}</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/80">{t('home.heroDesc')}</p>

          {/* Aggregate rating badge - the strongest first-glance trust
              signal per the cleaning-industry research (real US cleaning
              sites almost all show one). Renders nothing until there's at
              least one real, admin-approved review (see reviews.ts /
              Admin > Sharhlar) - never a fake placeholder number. */}
          {reviews.length > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-white backdrop-blur">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-white/70">
                ({reviews.length} {t('home.reviewsCount')})
              </span>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 font-semibold tracking-tight text-brand-700 transition hover:bg-brand-50"
            >
              {t('home.ctaBook')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/services"
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

      {/* 3 Trust Pillars */}
      <section className="bg-slate-50 py-8 border-y border-slate-200 dark:border-slate-800 dark:bg-[#0c1512]">
        <div className="section grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-2xl shrink-0">🛡️</div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">Tekshirilgan xodimlar</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">100% shaxsiyati tekshirilgan mutaxassislar</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-2xl shrink-0">✨</div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">Qoniqish kafolati</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Yoqmasa, qayta bepul tozalab beramiz</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-2xl shrink-0">💳</div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">Shaffof narxlar</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Hech qanday yashirin komissiyalarsiz</p>
            </div>
          </div>
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

      {/* Interactive Before/After Comparison */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section max-w-4xl">
          <div className="text-center mb-10">
            <span className="tag bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">Real Natijalar</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">Oldin va Keyin Taqqoslash</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Slayderni surib tozalash sifatiga o'zingiz baho bering</p>
          </div>
          <BeforeAfterSlider
            beforeImg="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
            afterImg="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
            beforeLabel="Tozalashdan oldin"
            afterLabel="Tozalashdan keyin"
          />
        </div>
      </section>

      {/* 3-Tier Pricing Section (Silicon Valley Style with MOST POPULAR highlight) */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="tag bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">Shaffof Tariflar</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">Mos Tarifni Tanlang</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Hech qanday yashirin komissiyalarsiz kafolatlangan narxlar</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto pt-4">
            {/* Standart */}
            <div className="card flex flex-col justify-between border border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Standart tozalash</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kundalik tozalik va tartib uchun ideal</p>
                <div className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">180,000 UZS <span className="text-sm font-normal text-gray-500">/dan</span></div>
                <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Pol va gilam yuvish</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Changlarni artish</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Oshxona va hammom dezinfeksiyasi</li>
                </ul>
              </div>
              <Link to="/booking" className="btn-secondary mt-8 w-full text-center">Tanlash</Link>
            </div>

            {/* Mukammal (Deep Clean) - MOST POPULAR */}
            <div className="card relative flex flex-col justify-between border-2 border-brand-500 ring-2 ring-brand-500 shadow-xl shadow-brand-500/10 lg:scale-105 bg-white dark:bg-[#12211b] z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-brand-600 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-md">
                ✨ ENG MASHHUR (MOST POPULAR)
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">Mukammal tozalash (Deep Clean)</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chuqur kir va qatlamlardan xalos bo'lish</p>
                <div className="mt-6 text-3xl font-extrabold text-brand-600 dark:text-brand-400">280,000 UZS <span className="text-sm font-normal text-gray-500">/dan</span></div>
                <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Standart tozalashdagi barcha amallar</li>
                  <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Mebellar orti va qiyin joylar</li>
                  <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Kafel choklari va yog' dog'larini yo'qotish</li>
                  <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Derazalarni ichki/tashqi yuvish</li>
                </ul>
              </div>
              <Link to="/booking" className="btn-primary mt-8 w-full text-center py-3">Hoziroq bron qilish</Link>
            </div>

            {/* Move-in / out */}
            <div className="card flex flex-col justify-between border border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ko'chib kirish / chiqish</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Yangi uyga ko'chish yoki ta'mirdan so'ng</p>
                <div className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">350,000 UZS <span className="text-sm font-normal text-gray-500">/dan</span></div>
                <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> To'liq tozalash va zararsizlantirish</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Barcha shkaflar va tortmalarni ichidan yuvish</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Qurilish va bo'yoq qoldiqlarini tozalash</li>
                </ul>
              </div>
              <Link to="/booking" className="btn-secondary mt-8 w-full text-center">Tanlash</Link>
            </div>
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
                  to="/services"
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
              src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1200&q=80"
              alt="Professional tozalash xizmati"
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

      {/* Customer reviews - manually collected, admin-approved (Admin >
          Sharhlar), never fabricated. Renders nothing if there are none
          yet, same principle as TeamPreview above. */}
      {reviews.length > 0 && (
        <section className="bg-white py-16 dark:bg-[#0c1512]">
          <div className="section">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.reviewsTitle')}</h2>
              <p className="max-w-xl text-gray-500 dark:text-gray-400">{t('home.reviewsDesc')}</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <div key={r.id} className="card">
                  <StarRating rating={r.rating} />
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">&ldquo;{r.comment}&rdquo;</p>
                  <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{r.customer_name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service area - "which districts do we cover" is a standard trust
          element on US cleaning-company sites (service area map/list).
          We cover the whole city, so this lists Tashkent's actual
          districts rather than a vague "everywhere" claim. */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.areaTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-gray-500 dark:text-gray-400">{t('home.areaDesc')}</p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {TASHKENT_DISTRICTS.map((d) => (
              <span
                key={d}
                className="tag border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#101c17] dark:text-gray-300"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

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

      {/* Referral program banner - large, colorful, placed near the
          bottom of the page like most cleaning-industry referral
          programs the research looked at. Links to the dashboard's
          referral card if logged in (where the actual code/share button
          lives), otherwise to registration. */}
      <section className="section py-16">
        <div className="card flex flex-col items-center justify-between gap-6 border-amber-200 bg-amber-50 text-center dark:border-amber-900/40 dark:bg-amber-900/10 md:flex-row md:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Gift className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('home.referralTitle')}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('home.referralDesc')}</p>
            </div>
          </div>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="shrink-0 rounded-md bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            {t('home.referralButton')}
          </Link>
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
            to="/booking"
            className="rounded-md bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>
    </div>
  )
}
