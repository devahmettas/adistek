import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import Button from './Button'
import NavIcon from './icons/NavIcon'
import { isJewelerFeatureEnabled, type JewelerFeatureKey } from '../constants/jewelerFeatures'
import {
  JEWELER_NAV_ITEMS,
  canAccessJewelerNavItem,
} from '../constants/jewelerNav'
import { useJewelerPermissions } from '../hooks/useJewelerPermissions'
import { useAuth } from '../store/AuthStore'

interface RestaurantSidebarProps {
  open: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `nav-item ${isActive ? 'nav-item--active' : 'nav-item--idle'}`
}

function disabledNavLinkClass({ isActive }: { isActive: boolean }) {
  return `nav-item ${isActive ? 'nav-item--active' : 'nav-item--locked'}`
}

export default function RestaurantSidebar({ open, mobileOpen, onCloseMobile }: RestaurantSidebarProps) {
  const { restaurant, staff, logout, isOwner } = useAuth()
  const { permissions: permissionMap } = useJewelerPermissions()
  const visibleNavItems = JEWELER_NAV_ITEMS.filter((item) => canAccessJewelerNavItem(
    item,
    restaurant,
    permissionMap,
    isOwner,
  ))

  const handleLogout = async () => {
    await logout()
  }

  const displayName = staff?.name ?? restaurant?.name
  const initials = displayName
    ? displayName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '?'

  const sidebarContent = (
    <>
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <NavLink to={visibleNavItems[0]?.to ?? '/dashboard'} onClick={onCloseMobile} className="block">
          <BrandLogo subtitle={displayName} inverted />
        </NavLink>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {visibleNavItems.map((item) => {
          const isLocked = Boolean(
            item.feature &&
            !isJewelerFeatureEnabled(restaurant, item.feature as JewelerFeatureKey),
          )

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={isLocked ? disabledNavLinkClass : navLinkClass}
              onClick={onCloseMobile}
            >
              <NavIcon name={isLocked ? '🔒' : item.icon} className="opacity-90" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isLocked && (
                <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-200">
                  Kapalı
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/15 bg-slate-950/50 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/25 text-xs font-bold text-brand-100 ring-1 ring-brand-400/30">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs font-medium text-slate-300">Kuyumcu Paneli</p>
          </div>
        </div>
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
        className={`app-sidebar transition-all duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${open ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden lg:shadow-none'}`}
      >
        <div
          className={`flex h-full min-h-0 w-64 flex-col transition-opacity duration-200 ${
            open ? 'lg:opacity-100' : 'lg:pointer-events-none lg:opacity-0'
          }`}
        >
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
