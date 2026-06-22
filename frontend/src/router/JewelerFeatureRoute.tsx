import { Outlet, useLocation } from 'react-router-dom'
import JewelerFeatureDisabledNotice from '../components/jeweler/JewelerFeatureDisabledNotice'
import { canAccessJewelerPath, getJewelerFeatureForPath } from '../constants/jewelerFeatures'
import { useAuth } from '../store/AuthStore'

export default function JewelerFeatureRoute() {
  const { restaurant } = useAuth()
  const location = useLocation()
  const feature = getJewelerFeatureForPath(location.pathname)

  if (feature && !canAccessJewelerPath(restaurant, location.pathname)) {
    return <JewelerFeatureDisabledNotice feature={feature} />
  }

  return <Outlet />
}
