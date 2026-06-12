import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import Button from './Button'
import { useAdminAuth } from '../store/AdminAuthStore'

const navItems = [
  { to: '/admin/restaurants/new', label: 'İşletme Ekle', icon: '＋' },
  { to: '/admin/restaurants', label: 'İşletme Listesi', icon: '☰', end: true },
]

interface AdminSidebarProps {
  open: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`
}

export default function AdminSidebar({ open, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const { admin, logout } = useAdminAuth()

  const handleLogout = async () => {
    await logout()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-5">
        <NavLink to="/admin/restaurants" onClick={onCloseMobile} className="block">
          <BrandLogo subtitle="Süper Admin" inverted />
        </NavLink>
        {admin && (
          <p className="mt-3 truncate rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-300">
            {admin.name}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={onCloseMobile}
          >
            <span className="text-xs opacity-90">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button type="button" variant="secondary" className="w-full" onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onCloseMobile}
          aria-label="Menüyü kapat"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950 shadow-panel transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${open ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
