import { NavLink } from 'react-router-dom'
import Button from './Button'
import { useAuth } from '../store/AuthStore'

const navItems = [
  { to: '/dashboard', label: 'Masalar', end: true },
  { to: '/dashboard/stats', label: 'İstatistikler' },
  { to: '/dashboard/menu', label: 'Müşteri Menüsü' },
  { to: '/dashboard/categories', label: 'Kategoriler' },
  { to: '/dashboard/products', label: 'Ürünler' },
  { to: '/dashboard/tables', label: 'Masa Ayarları' },
  { to: '/dashboard/staff', label: 'Personel' },
]

interface RestaurantSidebarProps {
  open: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }`
}

export default function RestaurantSidebar({ open, mobileOpen, onCloseMobile }: RestaurantSidebarProps) {
  const { restaurant, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-5">
        <NavLink to="/dashboard" onClick={onCloseMobile} className="block">
          <p className="text-lg font-bold text-gray-900">Menu Yönetimi</p>
          {restaurant && (
            <p className="mt-1 truncate text-sm text-gray-500">{restaurant.name}</p>
          )}
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={onCloseMobile}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <Button variant="secondary" onClick={handleLogout} className="w-full">
          Çıkış
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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-gray-200 bg-white transition-all duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${open ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden lg:border-r-0'}`}
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
