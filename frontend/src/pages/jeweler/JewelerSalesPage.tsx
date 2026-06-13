import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import JewelrySaleDetailModal from '../../components/jeweler/JewelrySaleDetailModal'
import JewelrySaleItemThumb from '../../components/jeweler/JewelrySaleItemThumb'
import StatsBarChart from '../../components/jeweler/StatsBarChart'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import {
  getJewelryCategories,
  getJewelrySales,
  type JewelryCategory,
  type JewelrySale,
} from '../../api/jeweler'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'
import {
  computeCategoryBreakdown,
  computePaymentBreakdown,
  computeSalesSummary,
  filterAndSortSales,
  getPaymentLabel,
  getSaleItemCategoryName,
  type SalesPageFilters,
  type SalesPeriodFilter,
} from '../../utils/jewelrySalesAnalytics'

const PERIOD_OPTIONS: Array<{ value: SalesPeriodFilter; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Son 7 Gün' },
  { value: 'month', label: 'Bu Ay' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'En yeni' },
  { value: 'oldest', label: 'En eski' },
  { value: 'amount_desc', label: 'En yüksek tutar' },
  { value: 'amount_asc', label: 'En düşük tutar' },
]

const EMPTY_FILTERS: SalesPageFilters = {
  search: '',
  period: 'all',
  paymentMethod: '',
  categoryId: '',
  sort: 'newest',
}

function getSaleCategoryLabels(sale: JewelrySale): string[] {
  const labels = new Set<string>()
  for (const item of sale.items ?? []) {
    labels.add(getSaleItemCategoryName(sale, item))
  }
  return [...labels]
}

export default function JewelerSalesPage() {
  const { itemCount, openCheckout, saleVersion } = useJewelrySaleCart()
  const [sales, setSales] = useState<JewelrySale[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SalesPageFilters>(EMPTY_FILTERS)
  const [selectedSale, setSelectedSale] = useState<JewelrySale | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [salesData, categoryData] = await Promise.all([
        getJewelrySales(),
        getJewelryCategories(),
      ])
      setSales(salesData)
      setCategories(categoryData)
    } catch {
      setError('Satışlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, saleVersion])

  const filteredSales = useMemo(
    () => filterAndSortSales(sales, filters),
    [sales, filters],
  )

  const summary = useMemo(() => computeSalesSummary(filteredSales), [filteredSales])
  const paymentBreakdown = useMemo(() => computePaymentBreakdown(filteredSales), [filteredSales])
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(filteredSales), [filteredSales])

  const paymentFilterOptions = useMemo(() => {
    const methods = [...new Set(sales.map((sale) => sale.payment_method))]
    return [
      { value: '', label: 'Tüm ödemeler' },
      ...methods.map((method) => ({ value: method, label: getPaymentLabel(method) })),
    ]
  }, [sales])

  const categoryFilterOptions = useMemo(() => [
    { value: '', label: 'Tüm kategoriler' },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
    { value: 'uncategorized', label: 'Kategorisiz' },
  ], [categories])

  const hasActiveFilters = (
    filters.search !== ''
    || filters.period !== 'all'
    || filters.paymentMethod !== ''
    || filters.categoryId !== ''
    || filters.sort !== 'newest'
  )

  const resetFilters = () => setFilters(EMPTY_FILTERS)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satış Yönetimi"
        description="Satış kayıtlarını, ödeme dağılımını ve kategori performansını tek panelden yönetin."
        actions={(
          <Button type="button" onClick={openCheckout}>
            {itemCount > 0 ? `Sepeti Aç (${itemCount})` : 'Yeni Satış'}
          </Button>
        )}
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && (
        <>
          {itemCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
              <p className="text-sm text-brand-900">
                Aktif sepette <strong>{itemCount}</strong> ürün bekliyor.
              </p>
              <Button type="button" size="sm" onClick={openCheckout}>
                Sepeti Aç
              </Button>
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PanelStatCard
              label="Filtrelenen ciro"
              value={formatPanelMoney(summary.revenue)}
              hint={`${summary.count} satış kaydı`}
              accent="brand"
            />
            <PanelStatCard
              label="Satılan ürün"
              value={String(summary.itemCount)}
              hint={`Ortalama ${formatPanelMoney(summary.averageSale)}`}
              accent="amber"
            />
            <PanelStatCard
              label="Net kar"
              value={formatPanelMoney(summary.grossProfit)}
              hint={`Maliyet ${formatPanelMoney(summary.totalCost)} · Marj %${summary.profitMargin}`}
              accent="emerald"
            />
            <PanelStatCard
              label="Kategori çeşidi"
              value={String(categoryBreakdown.length)}
              hint={`${paymentBreakdown.length} ödeme tipi`}
              accent="violet"
            />
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <StatsBarChart
              title="Ödeme yöntemine göre satış"
              items={paymentBreakdown.map((item) => ({
                label: item.label,
                value: item.value,
                hint: `${item.count} satış`,
              }))}
              valueFormatter={(value) => formatPanelMoney(value)}
              colorClass="bg-brand-500"
            />
            <StatsBarChart
              title="Kategoriye göre satış"
              items={categoryBreakdown.map((item) => ({
                label: item.label,
                value: item.value,
                hint: `${item.count} adet`,
              }))}
              valueFormatter={(value) => formatPanelMoney(value)}
              colorClass="bg-amber-500"
            />
          </div>

          <Card title={`Satış Kayıtları (${filteredSales.length})`}>
            <div className="mb-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <input
                  type="search"
                  placeholder="Satış no, ürün, müşteri..."
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  className="input-field h-9 min-w-0 flex-1 px-3 text-sm"
                />
                <div className="flex flex-wrap items-center gap-1">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilters((current) => ({ ...current, period: option.value }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        filters.period === option.value
                          ? 'bg-brand-700 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  value={filters.paymentMethod}
                  onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}
                  className="input-field h-9 px-2 text-xs"
                  aria-label="Ödeme yöntemi"
                >
                  {paymentFilterOptions.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={filters.categoryId}
                  onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
                  className="input-field h-9 px-2 text-xs"
                  aria-label="Kategori"
                >
                  {categoryFilterOptions.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={filters.sort}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    sort: event.target.value as SalesPageFilters['sort'],
                  }))}
                  className="input-field col-span-2 h-9 px-2 text-xs sm:col-span-2"
                  aria-label="Sıralama"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {sales.length === 0
                  ? 'Henüz satış kaydı yok.'
                  : 'Filtrelere uygun satış bulunamadı.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const itemCountForSale = (sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
                  const categoryLabels = getSaleCategoryLabels(sale)
                  const previewItems = (sale.items ?? []).slice(0, 4)
                  const extraItemCount = Math.max(0, (sale.items?.length ?? 0) - previewItems.length)

                  return (
                    <li key={sale.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="flex w-full flex-col gap-3 py-4 text-left transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
                      >
                        {(sale.items?.length ?? 0) > 0 && (
                          <div className="flex shrink-0 items-center gap-1.5 sm:order-first">
                            {previewItems.map((item) => (
                              <JewelrySaleItemThumb
                                key={item.id}
                                imagePath={item.product?.image_path}
                                name={item.product_name}
                                size="xs"
                              />
                            ))}
                            {extraItemCount > 0 && (
                              <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-100 px-1 text-[10px] font-semibold text-slate-600">
                                +{extraItemCount}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">#{sale.sale_number}</p>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              {getPaymentLabel(sale.payment_method)}
                            </span>
                            {Number(sale.discount) > 0 && (
                              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
                                -{formatPanelMoney(Number(sale.discount))} indirim
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(sale.sold_at).toLocaleString('tr-TR')}
                            {sale.customer ? ` · ${sale.customer.name}` : ''}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {categoryLabels.map((label) => (
                              <span
                                key={label}
                                className="rounded-md border border-amber-100 bg-amber-50/80 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-slate-600">
                            {(sale.items ?? []).slice(0, 3).map((item) => item.product_name).join(' · ')}
                            {(sale.items?.length ?? 0) > 3 ? ' ...' : ''}
                          </p>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-lg font-bold text-brand-700">{formatPanelMoney(Number(sale.total))}</p>
                          <p className="mt-1 text-xs text-slate-500">{itemCountForSale} ürün · Detay →</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {selectedSale && (
        <JewelrySaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  )
}
