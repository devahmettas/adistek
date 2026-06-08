import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import RestaurantSidebar from '../components/RestaurantSidebar'
import { DashboardProvider } from '../context/DashboardContext'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-slate-50">
        <RestaurantSidebar
          open={sidebarOpen}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div
          className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          }`}
        >
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
              <button
                type="button"
                onClick={() => {
                  if (window.matchMedia('(min-width: 1024px)').matches) {
                    setSidebarOpen((value) => !value)
                  } else {
                    setMobileMenuOpen((value) => !value)
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Menüyü aç/kapat"
              >
                <span className="text-base leading-none">☰</span>
                Menü
              </button>
              <p className="hidden text-sm text-slate-500 sm:block">İşletme yönetim paneli</p>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  )
}
