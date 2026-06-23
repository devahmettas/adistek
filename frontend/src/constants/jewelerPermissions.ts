export const JEWELER_PERMISSIONS = {
  view_dashboard: 'view_dashboard',
  view_vault: 'view_vault',
  view_profits: 'view_profits',
  view_reports: 'view_reports',
  manage_products: 'manage_products',
  manage_sales: 'manage_sales',
  manage_purchases: 'manage_purchases',
  manage_customers: 'manage_customers',
  manage_stock_count: 'manage_stock_count',
  manage_settings: 'manage_settings',
} as const

export type JewelerPermissionKey = keyof typeof JEWELER_PERMISSIONS

export const JEWELER_PERMISSION_LABELS: Record<JewelerPermissionKey, string> = {
  view_dashboard: 'Dashboard',
  view_vault: 'Kasa yönetimi',
  view_profits: 'Kazanç ve kar bilgileri',
  view_reports: 'Raporlama',
  manage_products: 'Ürün yönetimi',
  manage_sales: 'Satış işlemleri',
  manage_purchases: 'Alış işlemleri',
  manage_customers: 'Müşteri yönetimi',
  manage_stock_count: 'Stok takip',
  manage_settings: 'Operasyonel ayarlar',
}

export const JEWELER_PERMISSION_DEFAULTS: Record<JewelerPermissionKey, boolean> = {
  view_dashboard: true,
  view_vault: false,
  view_profits: false,
  view_reports: false,
  manage_products: true,
  manage_sales: true,
  manage_purchases: true,
  manage_customers: true,
  manage_stock_count: true,
  manage_settings: false,
}

export const JEWELER_OWNER_PERMISSIONS: Record<JewelerPermissionKey, boolean> = {
  view_dashboard: true,
  view_vault: true,
  view_profits: true,
  view_reports: true,
  manage_products: true,
  manage_sales: true,
  manage_purchases: true,
  manage_customers: true,
  manage_stock_count: true,
  manage_settings: true,
}

export type JewelerPermissionMap = Record<JewelerPermissionKey, boolean>

export function normalizeJewelerPermissions(
  permissions?: Partial<JewelerPermissionMap> | null,
): JewelerPermissionMap {
  const normalized = { ...JEWELER_PERMISSION_DEFAULTS }

  if (!permissions) {
    return normalized
  }

  for (const key of Object.keys(JEWELER_PERMISSION_DEFAULTS) as JewelerPermissionKey[]) {
    if (key in permissions) {
      normalized[key] = Boolean(permissions[key])
    }
  }

  return normalized
}
