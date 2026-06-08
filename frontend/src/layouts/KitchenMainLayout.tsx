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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/kitchen/dashboard">
            <BrandLogo subtitle="Mutfak Paneli" size="md" inverted />
          </Link>
          {kitchenStaff && (
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-brand-900/50 px-3 py-1 text-sm font-medium text-brand-200 sm:inline">
                {kitchenStaff.name}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Çıkış
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
