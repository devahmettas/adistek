import { Link } from 'react-router-dom'
import type { RestaurantListItem } from '../../api/types'
import { BUSINESS_TYPE_LABELS, isJewelerBusiness } from '../../constants/businessType'
import { displayAdminValue } from '../../utils/adminDashboard'
import {
  formatMembershipEndDate,
  formatMembershipStatus,
  formatServiceFee,
} from '../../utils/adminMembership'
import GoogleMapsDirectionsButton from './GoogleMapsDirectionsButton'

interface AdminRestaurantCardProps {
  restaurant: RestaurantListItem
}

export default function AdminRestaurantCard({ restaurant }: AdminRestaurantCardProps) {
  const isJeweler = isJewelerBusiness(restaurant.business_type)
  const typeLabel = BUSINESS_TYPE_LABELS[restaurant.business_type ?? 'restaurant']
  const expired = Boolean(restaurant.membership_expired)

  return (
    <Link
      to={`/admin/restaurants/${restaurant.id}`}
      className={`group block overflow-hidden rounded-2xl border bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-panel ${
        expired ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200 hover:border-brand-200'
      }`}
    >
      {expired && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-800">
          Üyelik süresi doldu
        </div>
      )}

      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              {typeLabel}
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900 group-hover:text-brand-800">
              {restaurant.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-800">
            #{restaurant.id}
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4 text-sm">
        <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Hizmet Bedeli
            </p>
            <p className="mt-1 font-bold text-slate-900">{formatServiceFee(restaurant.service_fee)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Üyelik</p>
            <p
              className={`mt-1 font-bold ${
                expired
                  ? 'text-red-700'
                  : restaurant.membership_days_remaining === 0
                    ? 'text-amber-700'
                    : 'text-emerald-700'
              }`}
            >
              {formatMembershipStatus(
                restaurant.membership_days_remaining,
                restaurant.membership_expired,
                restaurant.membership_end_date,
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatMembershipEndDate(restaurant.membership_end_date)}
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <p className="text-slate-700">
            <span className="text-slate-400">Yetkili:</span>{' '}
            {displayAdminValue(restaurant.contact_person)}
          </p>
          <p className="text-slate-700">
            <span className="text-slate-400">Telefon:</span> {displayAdminValue(restaurant.phone)}
          </p>
          <p className="line-clamp-2 text-slate-700">
            <span className="text-slate-400">Adres:</span> {displayAdminValue(restaurant.address)}
          </p>
        </div>

        <GoogleMapsDirectionsButton address={restaurant.address} />

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {isJeweler ? (
            <>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {restaurant.jewelry_products_count ?? 0} ürün
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {restaurant.jewelry_sales_count ?? 0} satış
              </span>
            </>
          ) : (
            <>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {restaurant.categories_count} kategori
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {restaurant.products_count} ürün
              </span>
            </>
          )}
        </div>

        <p className="text-xs font-semibold text-brand-700 group-hover:text-brand-800">
          Detay ve üyelik yönetimi →
        </p>
      </div>
    </Link>
  )
}
