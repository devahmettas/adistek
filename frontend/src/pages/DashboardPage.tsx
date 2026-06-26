import { Navigate } from 'react-router-dom'
import { getFirstJewelerAccessiblePath } from '../constants/jewelerNav'
import { useJewelerPermissions } from '../hooks/useJewelerPermissions'
import { useAuth } from '../store/AuthStore'
import JewelerDashboardPage from './jeweler/JewelerDashboardPage'

export default function DashboardPage() {
  const { restaurant, isOwner, permissions } = useAuth()
  const { can } = useJewelerPermissions()

  if (!isOwner && !can('view_dashboard')) {
    return <Navigate to={getFirstJewelerAccessiblePath(restaurant, permissions, isOwner)} replace />
  }

  return <JewelerDashboardPage />
}
