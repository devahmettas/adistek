import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import Button from '../components/Button'
import { useKitchenAuth } from '../store/KitchenAuthStore'

export default function KitchenMainLayout() {
  const { kitchenStaff, logout } = useKitchenAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:px-6">
          <Link to="/kitchen/dashboard">
            <BrandLogo subtitle="Mutfak Paneli" size="md" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Canlı
            </span>
            {kitchenStaff && (
              <span className="hidden rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 md:inline">
                {kitchenStaff.name}
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-7xl px-3 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
