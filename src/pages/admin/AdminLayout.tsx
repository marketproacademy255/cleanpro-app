import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Umumiy holat', end: true },
  { to: '/admin/bookings', label: 'Buyurtmalar' },
  { to: '/admin/staff', label: 'Xizmatchilar' },
  { to: '/admin/services', label: "Xizmatlar va narxlar" },
  { to: '/admin/addons', label: "Qo'shimcha xizmatlar" },
  { to: '/admin/reviews', label: 'Sharhlar' },
]

export default function AdminLayout() {
  return (
    <div className="section grid gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Admin panel</h2>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-900/30 dark:hover:text-brand-300'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
