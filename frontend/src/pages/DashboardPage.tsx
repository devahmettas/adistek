import { isJewelerBusiness } from '../constants/businessType'
import { useAuth } from '../store/AuthStore'
import JewelerDashboardPage from './jeweler/JewelerDashboardPage'
import ManagementPanelPage from './restaurant/ManagementPanelPage'

export default function DashboardPage() {
  const { restaurant } = useAuth()

  if (isJewelerBusiness(restaurant?.business_type)) {
    return <JewelerDashboardPage />
  }

  return <ManagementPanelPage />
}
