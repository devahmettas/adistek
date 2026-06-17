import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import Button from '../components/Button'
import { useWaiterAuth } from '../store/WaiterAuthStore'

export default function WaiterMainLayout() {
  const { waiter, logout } = useWaiterAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
          <Link to="/waiter/dashboard">
            <BrandLogo subtitle="Garson Paneli" size="md" />
          </Link>
          {waiter && (
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800 sm:inline">
                {waiter.name}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Çıkış
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-3 py-5 sm:px-4 sm:py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
