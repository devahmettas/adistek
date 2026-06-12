import { Navigate, Outlet } from 'react-router-dom'
import { isJewelerBusiness } from '../constants/businessType'
import { useAuth } from '../store/AuthStore'

export function RestaurantOnlyRoute() {
  const { restaurant } = useAuth()

  if (isJewelerBusiness(restaurant?.business_type)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function JewelerOnlyRoute() {
  const { restaurant } = useAuth()

  if (!isJewelerBusiness(restaurant?.business_type)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
