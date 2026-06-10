import { Link } from 'react-router-dom'
import type { RestaurantListItem } from '../../api/types'
import { displayAdminValue } from '../../utils/adminDashboard'

interface AdminRestaurantCardProps {
  restaurant: RestaurantListItem
}

export default function AdminRestaurantCard({ restaurant }: AdminRestaurantCardProps) {
  return (
    <Link
      to={`/admin/restaurants/${restaurant.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              Restoran
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900">{restaurant.name}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-800">
            #{restaurant.id}
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4 text-sm">
        <div className="grid gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400">👤</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Yetkili Kişi
              </p>
              <p className="font-medium text-slate-800">
                {displayAdminValue(restaurant.contact_person)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400">📞</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Telefon
              </p>
              <p className="font-medium text-slate-800">{displayAdminValue(restaurant.phone)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400">📍</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Adres</p>
              <p className="line-clamp-2 font-medium text-slate-800">
                {displayAdminValue(restaurant.address)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400">✉</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Giriş E-postası
              </p>
              <p className="break-all font-medium text-slate-800">{restaurant.email}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {restaurant.categories_count} kategori
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {restaurant.products_count} ürün
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {restaurant.tables_count} masa
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Kayıt: {new Date(restaurant.created_at).toLocaleString('tr-TR')}
        </p>
        <p className="mt-2 text-xs font-semibold text-brand-700 group-hover:text-brand-800">
          Detayları gör →
        </p>
      </div>
    </Link>
  )
}
