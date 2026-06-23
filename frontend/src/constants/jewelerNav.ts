import type { Restaurant } from '../api/types'
import type { JewelerFeatureKey } from './jewelerFeatures'
import { isJewelerFeatureEnabled } from './jewelerFeatures'
import {
  JEWELER_OWNER_PERMISSIONS,
  normalizeJewelerPermissions,
  type JewelerPermissionMap,
} from './jewelerPermissions'

export interface JewelerNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

export interface JewelerNavItemWithFeature extends JewelerNavItem {
  feature?: JewelerFeatureKey
  always?: boolean
  ownerOnly?: boolean
  permission?: import('./jewelerPermissions').JewelerPermissionKey
}

export const JEWELER_NAV_ITEMS: JewelerNavItemWithFeature[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂', end: true, permission: 'view_dashboard' },
  { to: '/dashboard/jeweler/products', label: 'Ürün Yönetimi', icon: '◆', permission: 'manage_products' },
  { to: '/dashboard/jeweler/purchases', label: 'Ürün Alış Satış', icon: '⇅', permission: 'manage_purchases' },
  { to: '/dashboard/jeweler/history', label: 'İşlem Geçmişi', icon: '☰', permission: 'manage_sales' },
  { to: '/dashboard/jeweler/vault', label: 'Kasa Yönetimi', icon: '▤', permission: 'view_vault' },
  { to: '/dashboard/jeweler/stock-count', label: 'Stok Takip', icon: '▧', permission: 'manage_stock_count' },
  { to: '/dashboard/jeweler/customers', label: 'Müşteri Yönetimi', icon: '◉', permission: 'manage_customers' },
  { to: '/dashboard/jeweler/barcode', label: 'Barkod Sistemi', icon: '▥', feature: 'barcode', permission: 'manage_products' },
  { to: '/dashboard/jeweler/gold-prices', label: 'Altın Fiyatları', icon: '★' },
  { to: '/dashboard/jeweler/reports', label: 'Raporlama', icon: '▦', feature: 'reports', permission: 'view_reports' },
  { to: '/dashboard/jeweler/profile', label: 'Profil', icon: '⚙', ownerOnly: true },
]

export function getFirstJewelerAccessiblePath(
  restaurant: Restaurant | null | undefined,
  permissions?: Partial<JewelerPermissionMap> | null,
  isOwner = true,
): string {
  const permissionMap = isOwner
    ? JEWELER_OWNER_PERMISSIONS
    : normalizeJewelerPermissions(permissions)

  for (const item of JEWELER_NAV_ITEMS) {
    if (canAccessJewelerNavItem(item, restaurant, permissionMap, isOwner)) {
      return item.to
    }
  }

  return '/login'
}

export function canAccessJewelerNavItem(
  item: JewelerNavItemWithFeature,
  restaurant: Restaurant | null | undefined,
  permissionMap: JewelerPermissionMap,
  isOwner: boolean,
): boolean {
  if (item.ownerOnly && !isOwner) {
    return false
  }

  if (item.permission && !permissionMap[item.permission]) {
    return false
  }

  if (item.feature && !isJewelerFeatureEnabled(restaurant, item.feature)) {
    return false
  }

  return true
}

export function getDefaultJewelerDashboardPath(
  restaurant?: Restaurant | null,
  permissions?: Partial<JewelerPermissionMap> | null,
  isOwner = true,
): string {
  return getFirstJewelerAccessiblePath(restaurant, permissions, isOwner)
}
