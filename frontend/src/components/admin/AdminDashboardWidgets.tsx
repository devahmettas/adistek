import { Link } from 'react-router-dom'
import type { AdminDashboardStats } from '../../utils/adminDashboard'

interface AdminStatCardProps {
  label: string
  value: number
  hint: string
  accent: 'brand' | 'emerald' | 'amber' | 'violet'
}

const accentStyles = {
  brand: 'from-brand-600 to-brand-800',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  violet: 'from-violet-500 to-violet-700',
}

export function AdminStatCard({ label, value, hint, accent }: AdminStatCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className={`bg-gradient-to-br ${accentStyles[accent]} px-5 py-4 text-white`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
      </div>
      <p className="px-5 py-3 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

interface AdminStatsGridProps {
  stats: AdminDashboardStats
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard
        label="Restoran"
        value={stats.restaurantCount}
        hint="Sisteme kayıtlı işletme sayısı"
        accent="brand"
      />
      <AdminStatCard
        label="Kategori"
        value={stats.categoryCount}
        hint="Tüm restoranlardaki toplam kategori"
        accent="emerald"
      />
      <AdminStatCard
        label="Ürün"
        value={stats.productCount}
        hint="Menüde tanımlı toplam ürün"
        accent="amber"
      />
      <AdminStatCard
        label="Masa"
        value={stats.tableCount}
        hint="Aktif masa tanımı toplamı"
        accent="violet"
      />
    </div>
  )
}

interface AdminEmptyStateProps {
  hasSearch: boolean
}

export function AdminEmptyState({ hasSearch }: AdminEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
        🏪
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">
        {hasSearch ? 'Aramanıza uygun restoran bulunamadı' : 'Henüz restoran eklenmemiş'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        {hasSearch
          ? 'Farklı bir arama terimi deneyin veya filtreyi temizleyin.'
          : 'İlk işletmeyi ekleyerek platformu kullanıma açın.'}
      </p>
      {!hasSearch && (
        <Link
          to="/admin/restaurants/new"
          className="mt-6 inline-flex rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          İlk Restoranı Ekle
        </Link>
      )}
    </div>
  )
}
