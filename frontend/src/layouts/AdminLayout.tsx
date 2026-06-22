import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import { getAdminPageLabel } from '../constants/adminNav'

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pageLabel = getAdminPageLabel(location.pathname)
  const isCreatePage = location.pathname === '/admin/restaurants/new'

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.matchMedia('(min-width: 1024px)').matches) {
                    setSidebarOpen((value) => !value)
                  } else {
                    setMobileMenuOpen((value) => !value)
                  }
                }}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Menüyü aç/kapat"
              >
                <span className="text-base leading-none">☰</span>
                <span className="hidden sm:inline">Menü</span>
              </button>
              <p className="hidden truncate text-sm text-slate-500 sm:block">{pageLabel}</p>
            </div>

            {!isCreatePage && (
              <Link
                to="/admin/restaurants/new"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 sm:gap-2 sm:px-4"
              >
                <span aria-hidden>＋</span>
                <span className="hidden min-[360px]:inline">İşletme Ekle</span>
                <span className="min-[360px]:hidden">Ekle</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
