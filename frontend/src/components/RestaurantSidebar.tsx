import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import Button from './Button'
import { isJewelerBusiness } from '../constants/businessType'
import { JEWELER_NAV_ITEMS } from '../constants/jewelerNav'
import { isJewelerFeatureEnabled, type JewelerFeatureKey } from '../constants/jewelerFeatures'
import {
  RESTAURANT_NAV_ITEMS,
  canAccessRestaurantNavItem,
} from '../constants/restaurantFeatures'
import { useAuth } from '../store/AuthStore'

interface RestaurantSidebarProps {
  open: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-700 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

function disabledNavLinkClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-11 items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-400 transition ${
    isActive ? 'border-amber-200 bg-amber-50 text-amber-800' : 'hover:border-slate-300 hover:bg-slate-100'
  }`
}

export default function RestaurantSidebar({ open, mobileOpen, onCloseMobile }: RestaurantSidebarProps) {
  const { restaurant, logout } = useAuth()
  const isJeweler = isJewelerBusiness(restaurant?.business_type)
  const visibleNavItems = isJeweler
    ? JEWELER_NAV_ITEMS
    : RESTAURANT_NAV_ITEMS.filter((item) => canAccessRestaurantNavItem(restaurant, item))

  const handleLogout = async () => {
    await logout()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-5">
        <NavLink to={visibleNavItems[0]?.to ?? '/dashboard'} onClick={onCloseMobile} className="block">
          <BrandLogo subtitle={restaurant?.name} />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNavItems.map((item) => {
          const isLocked = Boolean(
            isJeweler &&
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
              <span className="text-xs opacity-80">{isLocked ? '🔒' : item.icon}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isLocked && (
                <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Kapalı
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <Button variant="secondary" onClick={handleLogout} className="w-full">
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-slate-200 bg-white shadow-panel transition-all duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${open ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden lg:border-r-0 lg:shadow-none'}`}
      >
        <div
          className={`flex h-screen w-64 flex-col ${
            open ? 'lg:opacity-100' : 'lg:pointer-events-none lg:opacity-0'
          }`}
        >
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
