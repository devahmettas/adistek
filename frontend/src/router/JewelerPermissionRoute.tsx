import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { canAccessJewelerPath } from '../hooks/useJewelerPermissions'
import { useAuth } from '../store/AuthStore'

export default function JewelerPermissionRoute() {
  const { isOwner, permissions } = useAuth()
  const location = useLocation()

  if (!canAccessJewelerPath(location.pathname, permissions, isOwner)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
