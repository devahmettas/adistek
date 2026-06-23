import { useMemo } from 'react'
import {
  JEWELER_OWNER_PERMISSIONS,
  type JewelerPermissionKey,
  type JewelerPermissionMap,
  normalizeJewelerPermissions,
} from '../constants/jewelerPermissions'
import { useAuth } from '../store/AuthStore'

export function useJewelerPermissions() {
  const { isOwner, permissions, staff } = useAuth()

  const permissionMap = useMemo(
    () => (isOwner ? JEWELER_OWNER_PERMISSIONS : normalizeJewelerPermissions(permissions)),
    [isOwner, permissions],
  )

  const can = (permission: JewelerPermissionKey) => permissionMap[permission]

  const canViewProfits = can('view_profits')
  const canViewVault = can('view_vault')
  const canViewReports = can('view_reports')

  return {
    isOwner,
    staff,
    permissions: permissionMap,
    can,
    canViewProfits,
    canViewVault,
    canViewReports,
  }
}

export function canAccessJewelerPath(
  path: string,
  permissionMap: JewelerPermissionMap,
  isOwner: boolean,
): boolean {
  if (isOwner) {
    return true
  }

  if (path.includes('/jeweler/profile')) {
    return false
  }

  if (path === '/dashboard') return permissionMap.view_dashboard
  if (path.includes('/jeweler/vault')) return permissionMap.view_vault
  if (path.includes('/jeweler/reports')) return permissionMap.view_reports
  if (path.includes('/jeweler/products') || path.includes('/jeweler/barcode')) {
    return permissionMap.manage_products
  }
  if (path.includes('/jeweler/purchases')) return permissionMap.manage_purchases
  if (path.includes('/jeweler/history')) return permissionMap.manage_sales
  if (path.includes('/jeweler/stock-count')) return permissionMap.manage_stock_count
  if (path.includes('/jeweler/customers')) return permissionMap.manage_customers
  if (path.includes('/jeweler/settings')) return permissionMap.manage_settings
  if (path.includes('/jeweler/gold-prices')) return true

  return false
}
