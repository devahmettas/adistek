import { Link, useLocation } from 'react-router-dom'
import { ADMIN_NAV_ITEMS, type AdminNavItem } from '../constants/adminNav'
import { useAdminAuth } from '../store/AdminAuthStore'
import BrandLogo from './BrandLogo'
import Button from './Button'
import NavIcon from './icons/NavIcon'

interface AdminSidebarProps {
  open: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `nav-item ${isActive ? 'nav-item--active' : 'nav-item--idle'}`
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

  const initials = admin?.name
    ? admin.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'A'

  const sidebarContent = (
    <>
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <Link to="/admin/restaurants" onClick={onCloseMobile} className="block">
          <BrandLogo subtitle="Süper Admin" inverted />
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {ADMIN_NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={navLinkClass({ isActive: isNavItemActive(item, location.pathname) })}
            onClick={onCloseMobile}
          >
            <NavIcon name={item.icon} className="opacity-90" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/15 bg-slate-950/50 p-4">
        {admin && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/25 text-xs font-bold text-brand-100 ring-1 ring-brand-400/30">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{admin.name}</p>
              <p className="truncate text-xs font-medium text-slate-300">Süper Admin</p>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          className="w-full border-white/20 bg-white/10 font-semibold text-white hover:border-white/30 hover:bg-white/15 hover:text-white"
          onClick={handleLogout}
        >
          Çıkış Yap
        </Button>
      </div>
    </>
  )

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`app-sidebar transition-all duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${open ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden lg:shadow-none'}`}
      >
        <div
          className={`flex h-full min-h-0 w-64 flex-col transition-opacity duration-200 ease-in-out ${
            open ? 'lg:opacity-100' : 'lg:pointer-events-none lg:opacity-0'
          }`}
        >
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
