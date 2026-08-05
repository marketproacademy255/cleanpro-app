import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const links = [
  { to: '/', label: 'Bosh sahifa' },
  { to: '/xizmatlar', label: 'Xizmatlar va narxlar' },
  { to: '/biz-haqimizda', label: 'Biz haqimizda' },
  { to: '/aloqa', label: 'Aloqa' },
]

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="section flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand-700">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">CP</span>
          CleanPro
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
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

        <div className="hidden items-center gap-3 md:flex">
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

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menyu"
        >
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700">
                {l.label}
              </Link>
            ))}
            <hr className="my-1" />
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700">
                    Admin panel
                  </Link>
                )}
                <Link to="/kabinet" onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700">
                  Kabinetim
                </Link>
                <button onClick={handleSignOut} className="btn-secondary w-full">
                  Chiqish
                </button>
              </>
            ) : (
              <>
                <Link to="/kirish" onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700">
                  Kirish
                </Link>
                <Link to="/band-qilish" onClick={() => setOpen(false)} className="btn-primary w-full">
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
