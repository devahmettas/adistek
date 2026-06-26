import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import AdminSidebar from '../components/AdminSidebar'
import { getAdminPageLabel } from '../constants/adminNav'

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pageLabel = getAdminPageLabel(location.pathname)
  const isCreatePage = location.pathname === '/admin/restaurants/new'

  const handleToggleMenu = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarOpen((value) => !value)
    } else {
      setMobileMenuOpen((value) => !value)
    }
  }

  return (
    <div className="app-canvas min-h-screen overflow-x-clip">
      <AdminSidebar
        open={sidebarOpen}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <AppHeader
          label={pageLabel}
          onToggleMenu={handleToggleMenu}
          trailing={
            !isCreatePage ? (
              <Link
                to="/admin/restaurants/new"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 active:scale-[0.98] sm:gap-2 sm:px-4"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden min-[360px]:inline">İşletme Ekle</span>
                <span className="min-[360px]:hidden">Ekle</span>
              </Link>
            ) : undefined
          }
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full min-w-0 max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
