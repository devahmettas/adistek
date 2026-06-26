import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import Button from '../components/Button'
import { useWaiterAuth } from '../store/WaiterAuthStore'

export default function WaiterMainLayout() {
  const { waiter, logout } = useWaiterAuth()

  const handleLogout = async () => {
    await logout()
  }

  const initials = waiter?.name
    ? waiter.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'G'

  return (
    <div className="app-canvas min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
          <Link to="/waiter/dashboard">
            <BrandLogo subtitle="Garson Paneli" size="md" />
          </Link>
          {waiter && (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 sm:inline-flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                  {initials}
                </span>
                <span className="text-sm font-medium text-slate-700">{waiter.name}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Çıkış
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl animate-fade-in px-3 py-5 sm:px-4 sm:py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
