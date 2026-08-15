import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Umumiy holat', end: true },
  { to: '/admin/buyurtmalar', label: 'Buyurtmalar' },
  { to: '/admin/xizmatchilar', label: 'Xizmatchilar' },
  { to: '/admin/xizmatlar', label: "Xizmatlar va narxlar" },
  { to: '/admin/qoshimchalar', label: "Qo'shimcha xizmatlar" },
]

export default function AdminLayout() {
  return (
    <div className="section grid gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Admin panel</h2>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-brand-50'
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
