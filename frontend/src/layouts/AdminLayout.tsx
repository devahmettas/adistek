import { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

interface AdminLayoutProps {
  children?: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/admin/restaurants">
            <BrandLogo subtitle="Süper Admin" size="md" />
          </Link>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Sistem Yönetimi
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">{children ?? <Outlet />}</main>
    </div>
  )
}
