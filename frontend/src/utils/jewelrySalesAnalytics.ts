import type { JewelrySale } from '../api/jeweler'

export type SalesPeriodFilter = 'all' | 'today' | 'week' | 'month'
export type SalesSortOption = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'

export interface SalesPageFilters {
  search: string
  period: SalesPeriodFilter
  paymentMethod: string
  categoryId: string
  sort: SalesSortOption
}

export interface SalesSummary {
  count: number
  revenue: number
  subtotal: number
  discount: number
  itemCount: number
  averageSale: number
  totalCost: number
  grossProfit: number
  profitMargin: number
}

export interface SalesBreakdownItem {
  label: string
  value: number
  count: number
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale/EFT',
  gold_exchange: 'Altın Takas',
}

export function getPaymentLabel(method: string): string {
  return PAYMENT_LABELS[method] ?? method
}

export function getSaleItemCategoryName(_sale: JewelrySale, item: NonNullable<JewelrySale['items']>[number]): string {
  return item.product?.category?.name ?? 'Kategorisiz'
}

export function getSaleCategoryIds(sale: JewelrySale): number[] {
  const ids = new Set<number>()
  for (const item of sale.items ?? []) {
    const categoryId = item.product?.category_id ?? item.product?.category?.id
    if (categoryId) {
      ids.add(categoryId)
    }
  }
  return [...ids]
}

export function saleMatchesCategory(sale: JewelrySale, categoryId: string): boolean {
  if (!categoryId) return true
  if (categoryId === 'uncategorized') {
    return (sale.items ?? []).some((item) => !item.product?.category_id && !item.product?.category?.id)
  }
  const targetId = Number(categoryId)
  return getSaleCategoryIds(sale).includes(targetId)
}

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function isWithinPeriod(soldAt: string, period: SalesPeriodFilter): boolean {
  if (period === 'all') return true

  const saleDate = new Date(soldAt)
  const now = new Date()
  const todayStart = startOfDay(now)

  if (period === 'today') {
    return saleDate >= todayStart
  }

  if (period === 'week') {
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 6)
    return saleDate >= weekStart
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return saleDate >= monthStart
}

export function saleMatchesSearch(sale: JewelrySale, search: string): boolean {
  const query = search.trim().toLocaleLowerCase('tr-TR')
  if (!query) return true

  const haystack = [
    sale.sale_number,
    sale.customer?.name,
    sale.customer?.phone,
    sale.notes,
    ...(sale.items ?? []).map((item) => item.product_name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('tr-TR')

  return haystack.includes(query)
}

export function filterAndSortSales(sales: JewelrySale[], filters: SalesPageFilters): JewelrySale[] {
  const filtered = sales.filter((sale) => (
    isWithinPeriod(sale.sold_at, filters.period)
    && (filters.paymentMethod === '' || sale.payment_method === filters.paymentMethod)
    && saleMatchesCategory(sale, filters.categoryId)
    && saleMatchesSearch(sale, filters.search)
  ))

  return [...filtered].sort((left, right) => {
    switch (filters.sort) {
      case 'oldest':
        return new Date(left.sold_at).getTime() - new Date(right.sold_at).getTime()
      case 'amount_desc':
        return Number(right.total) - Number(left.total)
      case 'amount_asc':
        return Number(left.total) - Number(right.total)
      default:
        return new Date(right.sold_at).getTime() - new Date(left.sold_at).getTime()
    }
  })
}

export function computeSalesSummary(sales: JewelrySale[]): SalesSummary {
  let revenue = 0
  let subtotal = 0
  let discount = 0
  let itemCount = 0
  let totalCost = 0

  for (const sale of sales) {
    revenue += Number(sale.total)
    subtotal += Number(sale.subtotal)
    discount += Number(sale.discount)
    itemCount += (sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
    totalCost += (sale.items ?? []).reduce((sum, item) => sum + Number(item.line_cost || 0), 0)
  }

  const grossProfit = Math.round((revenue - totalCost) * 100) / 100

  return {
    count: sales.length,
    revenue: Math.round(revenue * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    itemCount,
    averageSale: sales.length > 0 ? Math.round((revenue / sales.length) * 100) / 100 : 0,
    totalCost: Math.round(totalCost * 100) / 100,
    grossProfit,
    profitMargin: revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0,
  }
}

export function computePaymentBreakdown(sales: JewelrySale[]): SalesBreakdownItem[] {
  const map = new Map<string, { value: number; count: number }>()

  for (const sale of sales) {
    const key = sale.payment_method
    const current = map.get(key) ?? { value: 0, count: 0 }
    current.value += Number(sale.total)
    current.count += 1
    map.set(key, current)
  }

  return [...map.entries()]
    .map(([method, data]) => ({
      label: getPaymentLabel(method),
      value: Math.round(data.value * 100) / 100,
      count: data.count,
    }))
    .sort((left, right) => right.value - left.value)
}

export function computeCategoryBreakdown(sales: JewelrySale[]): SalesBreakdownItem[] {
  const map = new Map<string, { value: number; count: number }>()

  for (const sale of sales) {
    for (const item of sale.items ?? []) {
      const label = getSaleItemCategoryName(sale, item)
      const current = map.get(label) ?? { value: 0, count: 0 }
      current.value += Number(item.line_total)
      current.count += item.quantity
      map.set(label, current)
    }
  }

  return [...map.entries()]
    .map(([label, data]) => ({
      label,
      value: Math.round(data.value * 100) / 100,
      count: data.count,
    }))
    .sort((left, right) => right.value - left.value)
}
