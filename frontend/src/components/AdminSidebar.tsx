import { Link, useLocation } from 'react-router-dom'
import { ADMIN_NAV_ITEMS, type AdminNavItem } from '../constants/adminNav'
import { useAdminAuth } from '../store/AdminAuthStore'
import BrandLogo from './BrandLogo'
import Button from './Button'

interface AdminSidebarProps {
  open: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`
}

function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  if (item.isActiveMatch) {
    return item.isActiveMatch(pathname)
  }

  if (item.end) {
    return pathname === item.to
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export default function AdminSidebar({ open, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const location = useLocation()
  const { admin, logout } = useAdminAuth()

  const handleLogout = async () => {
    await logout()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-5">
        <Link to="/admin/restaurants" onClick={onCloseMobile} className="block">
          <BrandLogo subtitle="Süper Admin" inverted />
        </Link>
        {admin && (
          <p className="mt-3 truncate rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-300">
            {admin.name}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={navLinkClass({ isActive: isNavItemActive(item, location.pathname) })}
            onClick={onCloseMobile}
          >
            <span className="text-xs opacity-90">{item.icon}</span>
            {item.label}
          </Link>
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
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950 shadow-panel transition-all duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${open ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden lg:shadow-none'}`}
      >
        <div
          className={`flex h-screen w-64 flex-col transition-opacity duration-200 ease-in-out ${
            open ? 'lg:opacity-100' : 'lg:pointer-events-none lg:opacity-0'
          }`}
        >
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
