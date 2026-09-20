import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
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
import TiltCard from '@/components/TiltCard'
import ParallaxSection from '@/components/ParallaxSection'
import AnimatedBackground from '@/components/AnimatedBackground'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { fetchApprovedReviews } from '@/lib/publicData'
import { formatUZS } from '@/lib/pricing'
import { BOOKING_DRAFT_KEY } from '@/lib/config'
import { triggerHaptic } from '@/lib/haptics'
import type { Review } from '@/lib/types'



export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])

  // Instant Quote Hero state
  const [heroRooms, setHeroRooms] = useState(2)
  const [heroTier, setHeroTier] = useState<'standard' | 'premium'>('standard')

  const heroEstimatedPrice = useMemo(() => {
    const base = heroTier === 'premium' ? 260000 : 180000
    const extraRoom = heroTier === 'premium' ? 60000 : 40000
    return base + Math.max(0, heroRooms - 1) * extraRoom
  }, [heroRooms, heroTier])

  function handleHeroBook() {
    triggerHaptic('medium')
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        rooms: heroRooms,
        tier: heroTier,
        city: 'Toshkent',
        time: '10:00',
        frequency: 'once',
      }),
    )
    navigate('/booking')
  }

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

      {/* Hero with Video Background & Split Left/Right Scroll Entry */}
      <ParallaxSection
        bgVideo="/hero-bg.mp4"
        overlayGradient="from-[#020a07]/95 via-[#061c14]/90 to-[#020a07]/92"
        speed={25}
        className="bg-brand-950"
      >
        <div className="section relative py-16 md:py-24 grid lg:grid-cols-12 gap-10 items-center">
          <Reveal direction="left" distance={120} className="lg:col-span-7">
            <div>
              {/* Social Proof Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4 backdrop-blur-sm shadow-sm">
                <span className="flex text-amber-400">★★★★★</span>
                <span>{t('home.socialProofBadge')}</span>
              </div>
              <div>
                <span className="tag bg-white/10 text-white">{t('home.heroTag')}</span>
              </div>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                {t('home.heroTitle')} <span className="text-brand-100">{t('home.heroTitleHighlight')}</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">{t('home.heroDesc')}</p>

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
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 font-semibold tracking-tight text-brand-700 transition hover:bg-brand-50 shadow-md"
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
          </Reveal>

          {/* Instant Quote Widget with Right Boundary Slide & 3D Tilt */}
          <Reveal direction="right" distance={120} className="lg:col-span-5">
            <TiltCard
              intensity={8}
              glowColor="rgba(52, 211, 153, 0.25)"
              className="rounded-3xl border border-white/20 bg-white/15 p-6 backdrop-blur-xl shadow-2xl text-white"
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <Calculator className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-lg">{t('home.instantQuoteTitle')}</h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1.5">{t('home.roomsLabel')}</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light')
                          setHeroRooms(n)
                        }}
                        className={`rounded-xl py-2 text-sm font-bold transition ${
                          heroRooms === n
                            ? 'bg-white text-brand-900 shadow-lg'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {n}{n === 5 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1.5">{t('home.typeLabel')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light')
                        setHeroTier('standard')
                      }}
                      className={`rounded-xl py-2.5 px-3 text-xs font-semibold transition text-left ${
                        heroTier === 'standard'
                          ? 'bg-white text-brand-900 shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="font-bold">{t('home.standardTitle')}</div>
                      <div className="text-[10px] opacity-80">{t('home.standardSub')}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light')
                        setHeroTier('premium')
                      }}
                      className={`rounded-xl py-2.5 px-3 text-xs font-semibold transition text-left ${
                        heroTier === 'premium'
                          ? 'bg-white text-brand-900 shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="font-bold">{t('home.deepTitle')}</div>
                      <div className="text-[10px] opacity-80">{t('home.deepSub')}</div>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 p-4 mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-white/70">{t('home.estimatedPriceLabel')}</div>
                    <div className="text-2xl font-extrabold text-emerald-300">
                      {formatUZS(heroEstimatedPrice)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleHeroBook}
                    className="btn-primary py-2.5 px-4 text-xs font-bold shadow-lg"
                  >
                    {t('home.bookNowBtn')} →
                  </button>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </ParallaxSection>

      {/* 3 Trust Pillars with Alternating Left / Center / Right Scroll Entry */}
      <section className="relative overflow-hidden bg-slate-50 py-8 border-y border-slate-200 dark:border-slate-800 dark:bg-[#0c1512]">
        <AnimatedBackground />
        <div className="section relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal direction="left" distance={100} delayMs={0}>
            <TiltCard intensity={6} className="p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 shadow-sm h-full">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-2xl shrink-0">🛡️</div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">{t('home.pillar1Title')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.pillar1Desc')}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>

          <Reveal direction="zoom" delayMs={150}>
            <TiltCard intensity={6} className="p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 shadow-sm h-full">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-2xl shrink-0">✨</div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">{t('home.pillar2Title')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.pillar2Desc')}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>

          <Reveal direction="right" distance={100} delayMs={300}>
            <TiltCard intensity={6} className="p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 shadow-sm h-full">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-2xl shrink-0">💳</div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">{t('home.pillar3Title')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.pillar3Desc')}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* How it works with Alternating Left / Up / Right Entry */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section">
          <Reveal direction="zoom">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.howTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.howDesc')}</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal
                key={s.title}
                direction={i === 0 ? 'left' : i === 1 ? 'up' : 'right'}
                distance={110}
                delayMs={i * 150}
              >
                <div className="card h-full">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Instant price estimate */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section max-w-2xl">
          <Reveal direction="zoom">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.estimateTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.estimateDesc')}</p>
          </Reveal>
          <Reveal direction="up" distance={80} delayMs={150} className="mt-8">
            <PriceEstimator />
          </Reveal>
        </div>
      </section>

      {/* Interactive Before/After Comparison */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section max-w-4xl">
          <Reveal direction="left" distance={100} className="text-center mb-10">
            <span className="tag bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">{t('home.resultsTag')}</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.resultsTitle')}</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{t('home.resultsDesc')}</p>
          </Reveal>
          <Reveal direction="right" distance={120} delayMs={150}>
            <BeforeAfterSlider
              beforeImg="/before-after/before.jpg"
              afterImg="/before-after/after.jpg"
              beforeLabel={t('home.beforeLabel')}
              afterLabel={t('home.afterLabel')}
            />
          </Reveal>
        </div>
      </section>

      {/* 3-Tier Pricing Section with Split Left/Center/Right Borders Entry */}
      <section className="relative overflow-hidden bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <AnimatedBackground />
        <div className="section relative z-10">
          <Reveal direction="zoom" className="text-center max-w-xl mx-auto mb-12">
            <span className="tag bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">{t('home.plansTag')}</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.plansTitle')}</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{t('home.plansDesc')}</p>
          </Reveal>
          <div className="grid gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto pt-4">
            {/* Standart - Slides from Left Boundary */}
            <Reveal direction="left" distance={120} delayMs={0} className="h-full">
              <TiltCard intensity={8} className="card flex flex-col justify-between border border-gray-200 dark:border-gray-800 h-full">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('home.planStandardName')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('home.planStandardSub')}</p>
                  <div className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">180,000 UZS <span className="text-sm font-normal text-gray-500">{t('home.fromSuffix')}</span></div>
                  <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planStandardF1')}</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planStandardF2')}</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planStandardF3')}</li>
                  </ul>
                </div>
                <Link to="/booking" className="btn-secondary mt-8 w-full text-center">{t('home.selectBtn')}</Link>
              </TiltCard>
            </Reveal>

            {/* Mukammal (Deep Clean) - Zooms & Floats in Center */}
            <Reveal direction="zoom" delayMs={150} className="h-full">
              <TiltCard intensity={12} glowColor="rgba(16, 185, 129, 0.25)" className="card relative flex flex-col justify-between border-2 border-brand-500 ring-2 ring-brand-500 shadow-xl shadow-brand-500/10 lg:scale-105 bg-white dark:bg-[#12211b] z-10 h-full">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-brand-600 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-md">
                  ✨ {t('home.mostPopularBadge')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{t('home.planDeepName')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('home.planDeepSub')}</p>
                  <div className="mt-6 text-3xl font-extrabold text-brand-600 dark:text-brand-400">280,000 UZS <span className="text-sm font-normal text-gray-500">{t('home.fromSuffix')}</span></div>
                  <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planDeepF1')}</li>
                    <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planDeepF2')}</li>
                    <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planDeepF3')}</li>
                    <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planDeepF4')}</li>
                  </ul>
                </div>
                <Link to="/booking" className="btn-primary mt-8 w-full text-center py-3">{t('home.bookNowBtn')}</Link>
              </TiltCard>
            </Reveal>

            {/* Move-in / out - Slides from Right Boundary */}
            <Reveal direction="right" distance={120} delayMs={300} className="h-full">
              <TiltCard intensity={8} className="card flex flex-col justify-between border border-gray-200 dark:border-gray-800 h-full">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('home.planMoveName')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('home.planMoveSub')}</p>
                  <div className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">350,000 UZS <span className="text-sm font-normal text-gray-500">{t('home.fromSuffix')}</span></div>
                  <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planMoveF1')}</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planMoveF2')}</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> {t('home.planMoveF3')}</li>
                  </ul>
                </div>
                <Link to="/booking" className="btn-secondary mt-8 w-full text-center">{t('home.selectBtn')}</Link>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Service tiles with Alternating Left and Right Entrance */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section">
          <Reveal direction="zoom">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.servicesTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.servicesDesc')}</p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTiles.map((tile, i) => (
              <Reveal
                key={tile.title}
                direction={i % 2 === 0 ? 'left' : 'right'}
                distance={100}
                delayMs={i * 100}
              >
                <TiltCard intensity={8} className="h-full">
                  <Link
                    to="/services"
                    className="group block h-full overflow-hidden rounded-lg border border-gray-200 transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:hover:border-brand-700 bg-white dark:bg-slate-900/60"
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
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section grid items-center gap-12 md:grid-cols-2">
          <Reveal direction="left" distance={120} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <img
              src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1200&q=80"
              alt="Professional tozalash xizmati"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Reveal>
          <Reveal direction="right" distance={120}>
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

      {/* Customer reviews with Alternating Left and Right Entrance */}
      {reviews.length > 0 && (
        <section className="bg-white py-16 dark:bg-[#0c1512]">
          <div className="section">
            <Reveal direction="zoom" className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.reviewsTitle')}</h2>
              <p className="max-w-xl text-gray-500 dark:text-gray-400">{t('home.reviewsDesc')}</p>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r, i) => (
                <Reveal
                  key={r.id}
                  direction={i % 2 === 0 ? 'left' : 'right'}
                  distance={100}
                  delayMs={i * 100}
                >
                  <TiltCard intensity={6} className="card flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <StarRating rating={r.rating} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {t('home.verifiedCustomer')}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">&ldquo;{r.comment}&rdquo;</p>
                    </div>
                    <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.customer_name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('home.verifiedServiceMeta')}</div>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service area */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <Reveal direction="zoom" className="section text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.areaTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-gray-500 dark:text-gray-400">{t('home.areaDesc')}</p>
        </Reveal>
      </section>

      {/* Gallery */}
      <section className="bg-white py-16 dark:bg-[#0c1512]">
        <div className="section">
          <Reveal direction="zoom">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.galleryTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.galleryDesc')}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {galleryPhotos.map((src, i) => (
              <Reveal key={src} delayMs={i * 80} direction={i % 2 === 0 ? 'left' : 'right'} distance={90}>
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

      {/* FAQ with Alternating Left and Right Entrance */}
      <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
        <div className="section max-w-3xl">
          <Reveal direction="zoom" className="text-center">
            <div className="flex items-center justify-center gap-2 text-brand-700 dark:text-brand-400">
              <MessageCircleQuestion className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t('home.faqTag')}</span>
            </div>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.faqTitle')}</h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => (
              <Reveal
                key={f.q}
                direction={i % 2 === 0 ? 'left' : 'right'}
                distance={100}
                delayMs={i * 80}
              >
                <details className="card group cursor-pointer">
                  <summary className="flex list-none items-center justify-between font-semibold text-gray-900 marker:content-none dark:text-gray-100">
                    {f.q}
                    <span className="ml-4 shrink-0 text-brand-600 transition group-open:rotate-45 dark:text-brand-400">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{f.a}</p>
                </details>
              </Reveal>
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
