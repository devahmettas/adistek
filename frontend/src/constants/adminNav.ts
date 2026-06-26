export interface AdminNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
  isActiveMatch?: (pathname: string) => boolean
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin/restaurants',
    label: 'Genel Bakış',
    icon: '⌂',
    end: true,
  },
  {
    to: '/admin/restaurants/list',
    label: 'İşletme Listesi',
    icon: '☰',
    isActiveMatch: (pathname) =>
      pathname === '/admin/restaurants/list' ||
      (pathname.startsWith('/admin/restaurants/') &&
        pathname !== '/admin/restaurants/new' &&
        pathname !== '/admin/restaurants'),
  },
  {
    to: '/admin/restaurants/new',
    label: 'Kuyumcu Ekle',
    icon: '＋',
    end: true,
  },
]

export function getAdminPageLabel(pathname: string): string {
  if (pathname === '/admin/restaurants/list') {
    return 'İşletme Listesi'
  }

  if (pathname === '/admin/restaurants/new') {
    return 'Kuyumcu Ekle'
  }

  if (pathname.startsWith('/admin/restaurants/') && pathname !== '/admin/restaurants/new') {
    return 'İşletme Detayı'
  }

  return 'Süper Admin Paneli'
}
