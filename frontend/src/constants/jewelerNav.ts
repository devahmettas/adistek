export interface JewelerNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

export const JEWELER_NAV_ITEMS: JewelerNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/dashboard/jeweler/products', label: 'Ürün Yönetimi', icon: '◆' },
  { to: '/dashboard/jeweler/purchases', label: 'Ürün Al Yönetimi', icon: '↓' },
  { to: '/dashboard/jeweler/vault', label: 'Kasa Yönetimi', icon: '▤' },
  { to: '/dashboard/jeweler/sales', label: 'Satış Yönetimi', icon: '₺' },
  { to: '/dashboard/jeweler/repairs', label: 'Tamir Takibi', icon: '⚙' },
  { to: '/dashboard/jeweler/customers', label: 'Müşteri Yönetimi', icon: '◉' },
  { to: '/dashboard/jeweler/barcode', label: 'Barkod Sistemi', icon: '▥' },
  { to: '/dashboard/jeweler/gold-prices', label: 'Altın Fiyatları', icon: '★' },
  { to: '/dashboard/jeweler/reports', label: 'Raporlama', icon: '▦' },
  { to: '/dashboard/jeweler/settings', label: 'Ayarlar', icon: '⚙' },
]

export function getDefaultJewelerDashboardPath(): string {
  return JEWELER_NAV_ITEMS[0]?.to ?? '/dashboard'
}
