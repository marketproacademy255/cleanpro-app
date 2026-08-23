import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Moon, Phone, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { IS_DEMO } from '@/lib/config'

const links = [
  { to: '/', label: 'Bosh sahifa' },
  { to: '/xizmatlar', label: 'Xizmatlar va narxlar' },
  { to: '/maslahatlar', label: 'Maslahatlar' },
  { to: '/biz-haqimizda', label: 'Biz haqimizda' },
  { to: '/aloqa', label: 'Aloqa' },
]

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

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
      className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition-shadow duration-300 ${
        scrolled ? 'border-gray-200 shadow-sm' : 'border-transparent shadow-none'
      }`}
    >
      <div
        className={`section flex items-center justify-between transition-[height] duration-300 ${
          scrolled ? 'h-14' : 'h-16'
        }`}
      >
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-600 text-white">CP</span>
          CleanPro
          {IS_DEMO && (
            <span className="tag bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              Demo
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-brand-700 ${isActive ? 'text-brand-700' : 'text-gray-600'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                  Admin panel
                </Link>
              )}
              <Link to="/kabinet" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                {profile?.full_name || 'Kabinetim'}
              </Link>
              <button onClick={handleSignOut} className="btn-secondary py-2">
                Chiqish
              </button>
            </>
          ) : (
            <>
              <Link to="/kirish" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                Kirish
              </Link>
              <Link to="/band-qilish" className="btn-primary py-2">
                Buyurtma berish
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-gray-200 text-gray-500 transition hover:border-brand-600 hover:text-brand-700"
            onClick={toggleTheme}
            aria-label="Mavzuni almashtirish"
            title="Mavzuni almashtirish"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-gray-200 text-gray-500 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menyu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="tel:+998901112233"
              className="flex items-center gap-1.5 rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              <Phone className="h-3.5 w-3.5" />
              +998 90 111 22 33
            </a>
            <hr className="my-1" />
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50"
                  >
                    Admin panel
                  </Link>
                )}
                <Link
                  to="/kabinet"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50"
                >
                  Kabinetim
                </Link>
                <button onClick={handleSignOut} className="btn-secondary mt-1 w-full">
                  Chiqish
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/kirish"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50"
                >
                  Kirish
                </Link>
                <Link to="/band-qilish" onClick={() => setOpen(false)} className="btn-primary mt-1 w-full">
                  Buyurtma berish
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
