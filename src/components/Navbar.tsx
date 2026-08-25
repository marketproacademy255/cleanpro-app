import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Moon, Phone, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from '@/context/LanguageContext'
import { IS_DEMO } from '@/lib/config'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/xizmatlar', label: t('nav.services') },
    { to: '/maslahatlar', label: t('nav.blog') },
    { to: '/biz-haqimizda', label: t('nav.about') },
    { to: '/aloqa', label: t('nav.contact') },
  ]

  // Header is `sticky` (see className below), so it already sits in normal
  // flow at the top of the page and only "sticks" once you scroll past it -
  // this just tracks that moment to add a subtle shadow/compact transition
  // (like kun.uz's header) instead of an abrupt, static-looking stick.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition-shadow duration-300 dark:bg-[#101c17]/90 ${
        scrolled ? 'border-gray-200 shadow-sm dark:border-gray-800' : 'border-transparent shadow-none'
      }`}
    >
      {/*
        Deliberately NOT using the shared `.section` (max-w-6xl) container
        here - on wide monitors that squeezed the brand block + 5 nav links
        + auth actions + language/theme toggles into a ~1150px-wide box in
        the middle of the screen, forcing nav labels and the "Buyurtma
        berish" button to wrap onto two lines. The header gets its own,
        wider max-width plus `whitespace-nowrap` everywhere so nothing
        wraps, with `shrink-0` on the brand/actions groups so only the nav
        links (which have room to spare) would ever be asked to compress.
      */}
      <div
        className={`mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-4 transition-[height] duration-300 sm:px-6 lg:px-10 ${
          scrolled ? 'h-16' : 'h-20'
        }`}
      >
        <Link to="/" className="flex min-w-0 items-center gap-3 leading-none tracking-tight text-brand-700 dark:text-brand-400 lg:shrink-0 lg:whitespace-nowrap">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-600 text-lg font-extrabold text-white">
            {t('brand.initials')}
          </span>
          <span className="flex min-w-0 flex-col justify-center gap-0.5">
            <span className="truncate text-lg font-extrabold leading-tight sm:text-xl">{t('brand.name')}</span>
            {/* Tagline mayda ekranlarda joy tejash uchun yashirilsin - brend nomi
                o'zi kifoya, "CLEANING SERVICES" faqat sm+ ekranlarda ko'rinsin. */}
            <span className="hidden truncate text-[11px] font-semibold uppercase leading-none tracking-wide text-gray-400 dark:text-gray-500 sm:block">
              {t('brand.tagline')}
            </span>
          </span>
          {IS_DEMO && (
            <span className="tag bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              Demo
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `group relative whitespace-nowrap py-1 text-sm font-medium transition-colors duration-200 hover:text-brand-700 dark:hover:text-brand-400 ${
                  isActive ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {/* Animated underline: expands from the center on hover,
                      and stays fully expanded when the link is active. */}
                  <span
                    className={`pointer-events-none absolute -bottom-1 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-brand-600 transition-all duration-300 ease-out dark:bg-brand-400 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-400">
                  {t('nav.adminPanel')}
                </Link>
              )}
              <Link to="/kabinet" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-400">
                {profile?.full_name || t('nav.myAccount')}
              </Link>
              <button onClick={handleSignOut} className="btn-secondary whitespace-nowrap py-2">
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link to="/kirish" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-400">
                {t('nav.login')}
              </Link>
              <Link to="/band-qilish" className="btn-primary whitespace-nowrap py-2">
                {t('nav.bookNow')}
              </Link>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher compact />
          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-gray-200 text-gray-500 transition hover:border-brand-600 hover:text-brand-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
            onClick={toggleTheme}
            aria-label={t('nav.toggleTheme')}
            title={t('nav.toggleTheme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('nav.menu')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 dark:border-gray-800 dark:bg-[#101c17] lg:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-50 dark:text-gray-200 dark:active:bg-brand-900/40"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="tel:+998901112233"
              className="flex items-center gap-1.5 rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:text-gray-200 dark:active:bg-brand-900/40"
            >
              <Phone className="h-3.5 w-3.5" />
              +998 90 111 22 33
            </a>
            <hr className="my-1 dark:border-gray-800" />
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:text-gray-200 dark:active:bg-brand-900/40"
                  >
                    {t('nav.adminPanel')}
                  </Link>
                )}
                <Link
                  to="/kabinet"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:text-gray-200 dark:active:bg-brand-900/40"
                >
                  {t('nav.myAccount')}
                </Link>
                <button onClick={handleSignOut} className="btn-secondary mt-1 w-full">
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/kirish"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:text-gray-200 dark:active:bg-brand-900/40"
                >
                  {t('nav.login')}
                </Link>
                <Link to="/band-qilish" onClick={() => setOpen(false)} className="btn-primary mt-1 w-full">
                  {t('nav.bookNow')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
