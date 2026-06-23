import type { Restaurant } from '../api/types'
import type { JewelerNavItemWithFeature } from './jewelerNav'

export type JewelerFeatureKey = 'barcode' | 'reports'

const PATH_ACCESS: Array<{
  prefix: string
  feature?: JewelerFeatureKey
  always?: boolean
}> = [
  { prefix: '/dashboard/jeweler/barcode', feature: 'barcode' },
  { prefix: '/dashboard/jeweler/reports', feature: 'reports' },
  { prefix: '/dashboard', always: true },
]

export function isJewelerFeatureEnabled(
  restaurant:
    | Pick<Restaurant, 'feature_jeweler_barcode' | 'feature_jeweler_reports'>
    | null
    | undefined,
  feature: JewelerFeatureKey,
): boolean {
  if (!restaurant) {
    return false
  }

  switch (feature) {
    case 'barcode':
      return restaurant.feature_jeweler_barcode ?? true
    case 'reports':
      return restaurant.feature_jeweler_reports ?? true
  }
}

export function canAccessJewelerNavItem(
  restaurant: Restaurant | null | undefined,
  item: JewelerNavItemWithFeature,
): boolean {
  if (item.always) {
    return true
  }

  if (!item.feature) {
    return true
  }

  return isJewelerFeatureEnabled(restaurant, item.feature)
}

export function canAccessJewelerPath(
  restaurant: Restaurant | null | undefined,
  pathname: string,
): boolean {
  const rule = PATH_ACCESS.find((entry) => pathname.startsWith(entry.prefix))

  if (!rule) {
    return true
  }

  if (rule.always) {
    return true
  }

  if (!rule.feature) {
    return true
  }

  return isJewelerFeatureEnabled(restaurant, rule.feature)
}

export function getJewelerFeatureForPath(pathname: string): JewelerFeatureKey | null {
  if (pathname.startsWith('/dashboard/jeweler/barcode')) {
    return 'barcode'
  }

  if (pathname.startsWith('/dashboard/jeweler/reports')) {
    return 'reports'
  }

  return null
}

export function getDefaultJewelerAccessiblePath(restaurant: Restaurant | null | undefined): string {
  const items = [
    { to: '/dashboard', always: true },
    { to: '/dashboard/jeweler/products' },
    { to: '/dashboard/jeweler/purchases' },
    { to: '/dashboard/jeweler/history' },
    { to: '/dashboard/jeweler/vault' },
    { to: '/dashboard/jeweler/stock-count' },
    { to: '/dashboard/jeweler/customers' },
    { to: '/dashboard/jeweler/barcode', feature: 'barcode' as const },
    { to: '/dashboard/jeweler/gold-prices' },
    { to: '/dashboard/jeweler/reports', feature: 'reports' as const },
    { to: '/dashboard/jeweler/profile' },
  ]

  const match = items.find((item) => {
    if ('always' in item && item.always) {
      return true
    }

    if ('feature' in item && item.feature) {
      return isJewelerFeatureEnabled(restaurant, item.feature)
    }

    return true
  })

  return match?.to ?? '/dashboard'
}
