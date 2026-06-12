import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isJewelerBusiness } from '../constants/businessType'
import {
  canAccessRestaurantPath,
  getDefaultDashboardPath,
} from '../constants/restaurantFeatures'
import { useAuth } from '../store/AuthStore'

export default function RestaurantFeatureRoute() {
  const { restaurant } = useAuth()
  const location = useLocation()

  if (isJewelerBusiness(restaurant?.business_type)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!canAccessRestaurantPath(restaurant, location.pathname)) {
    const fallback = getDefaultDashboardPath(restaurant)

    if (fallback && fallback !== location.pathname) {
      return <Navigate to={fallback} replace />
    }

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-amber-900">Bu özellik aktif değil</p>
        <p className="mt-2 text-sm text-amber-800">
          İşletmeniz için bu modül süper admin tarafından kapatılmış. Erişim için yöneticinizle
          iletişime geçin.
        </p>
      </div>
    )
  }

  return <Outlet />
}
