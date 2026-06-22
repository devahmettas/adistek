import type { JewelerFeatureKey } from './jewelerFeatures'

export interface JewelerNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

export interface JewelerNavItemWithFeature extends JewelerNavItem {
  feature?: JewelerFeatureKey
  always?: boolean
}

export const JEWELER_NAV_ITEMS: JewelerNavItemWithFeature[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂', end: true, always: true },
  { to: '/dashboard/jeweler/products', label: 'Ürün Yönetimi', icon: '◆' },
  { to: '/dashboard/jeweler/purchases', label: 'Ürün Alış Satış', icon: '⇅' },
  { to: '/dashboard/jeweler/history', label: 'İşlem Geçmişi', icon: '☰' },
  { to: '/dashboard/jeweler/vault', label: 'Kasa Yönetimi', icon: '▤' },
  { to: '/dashboard/jeweler/stock-count', label: 'Stok Takip', icon: '▧' },
  { to: '/dashboard/jeweler/customers', label: 'Müşteri Yönetimi', icon: '◉' },
  { to: '/dashboard/jeweler/barcode', label: 'Barkod Sistemi', icon: '▥', feature: 'barcode' },
  { to: '/dashboard/jeweler/gold-prices', label: 'Altın Fiyatları', icon: '★' },
  { to: '/dashboard/jeweler/reports', label: 'Raporlama', icon: '▦', feature: 'reports' },
  { to: '/dashboard/jeweler/settings', label: 'Ayarlar', icon: '⚙' },
]

export function getDefaultJewelerDashboardPath(): string {
  return JEWELER_NAV_ITEMS[0]?.to ?? '/dashboard'
}
