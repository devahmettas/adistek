import type { Restaurant } from '../api/types'

export type RestaurantFeatureKey = 'order_tracking' | 'qr_menu' | 'reservations'

export interface RestaurantNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
  feature?: RestaurantFeatureKey
  anyFeature?: RestaurantFeatureKey[]
}

export const RESTAURANT_NAV_ITEMS: RestaurantNavItem[] = [
  { to: '/dashboard', label: 'Masalar', icon: '◫', end: true, feature: 'order_tracking' },
  { to: '/dashboard/stats', label: 'İstatistikler', icon: '▤', feature: 'order_tracking' },
  { to: '/dashboard/reservations', label: 'Rezervasyonlar', icon: '◷', feature: 'reservations' },
  { to: '/dashboard/menu', label: 'Müşteri Menüsü', icon: '◎', feature: 'qr_menu' },
  {
    to: '/dashboard/categories',
    label: 'Kategoriler',
    icon: '▦',
    anyFeature: ['order_tracking', 'qr_menu'],
  },
  {
    to: '/dashboard/products',
    label: 'Ürünler',
    icon: '▣',
    anyFeature: ['order_tracking', 'qr_menu'],
  },
  { to: '/dashboard/tables', label: 'Masa Ayarları', icon: '⬚', feature: 'order_tracking' },
  { to: '/dashboard/staff', label: 'Personel', icon: '◉', feature: 'order_tracking' },
]

const PATH_ACCESS: Array<{
  prefix: string
  feature?: RestaurantFeatureKey
  anyFeature?: RestaurantFeatureKey[]
}> = [
  { prefix: '/dashboard/stats', feature: 'order_tracking' },
  { prefix: '/dashboard/reservations', feature: 'reservations' },
  { prefix: '/dashboard/menu', feature: 'qr_menu' },
  { prefix: '/dashboard/categories', anyFeature: ['order_tracking', 'qr_menu'] },
  { prefix: '/dashboard/products', anyFeature: ['order_tracking', 'qr_menu'] },
  { prefix: '/dashboard/tables', feature: 'order_tracking' },
  { prefix: '/dashboard/staff', feature: 'order_tracking' },
  { prefix: '/dashboard', feature: 'order_tracking' },
]

export function isRestaurantFeatureEnabled(
  restaurant:
    | Pick<
        Restaurant,
        'feature_order_tracking' | 'feature_qr_menu' | 'feature_reservations'
      >
    | null
    | undefined,
  feature: RestaurantFeatureKey,
): boolean {
  if (!restaurant) {
    return false
  }

  switch (feature) {
    case 'order_tracking':
      return restaurant.feature_order_tracking ?? true
    case 'qr_menu':
      return restaurant.feature_qr_menu ?? true
    case 'reservations':
      return restaurant.feature_reservations ?? true
  }
}

export function canAccessRestaurantNavItem(
  restaurant: Restaurant | null | undefined,
  item: RestaurantNavItem,
): boolean {
  if (item.anyFeature) {
    return item.anyFeature.some((feature) => isRestaurantFeatureEnabled(restaurant, feature))
  }

  if (item.feature) {
    return isRestaurantFeatureEnabled(restaurant, item.feature)
  }

  return true
}

export function canAccessRestaurantPath(
  restaurant: Restaurant | null | undefined,
  path: string,
): boolean {
  const rule = PATH_ACCESS.find((entry) =>
    entry.prefix === '/dashboard'
      ? path === '/dashboard' || path === '/dashboard/'
      : path === entry.prefix || path.startsWith(`${entry.prefix}/`),
  )

  if (!rule) {
    return true
  }

  if (rule.anyFeature) {
    return rule.anyFeature.some((feature) => isRestaurantFeatureEnabled(restaurant, feature))
  }

  if (rule.feature) {
    return isRestaurantFeatureEnabled(restaurant, rule.feature)
  }

  return true
}

export function getDefaultDashboardPath(restaurant: Restaurant | null | undefined): string | null {
  for (const item of RESTAURANT_NAV_ITEMS) {
    if (canAccessRestaurantNavItem(restaurant, item)) {
      return item.to
    }
  }

  return null
}

export const RESTAURANT_FEATURE_OPTIONS = [
  {
    key: 'feature_order_tracking' as const,
    title: 'Masa & Sipariş Takibi',
    description: 'Masalar, mutfak, garson, istatistikler, ürün satışları ve personel yönetimi.',
  },
  {
    key: 'feature_qr_menu' as const,
    title: 'QR Menü Tasarımı',
    description: 'Müşteri menüsü, kategori/ürün görselleri, slaytlar ve menü paylaşımı.',
  },
  {
    key: 'feature_reservations' as const,
    title: 'Rezervasyon',
    description: 'Masa rezervasyonları ve rezervasyon ayarları.',
  },
]
