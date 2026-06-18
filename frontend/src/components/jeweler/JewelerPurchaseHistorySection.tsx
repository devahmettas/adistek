import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../Card'
import JewelryPurchaseDetailModal from './JewelryPurchaseDetailModal'
import LoadingState from '../LoadingState'
import { getJewelryPurchases, type JewelryPurchase } from '../../api/jeweler'
import { formatPanelMoney, PanelStatCard } from '../restaurant/ManagementPanelWidgets'
import {
  computePurchaseSummary,
  createDefaultPurchaseFilters,
  filterAndSortPurchases,
  getPaymentLabel,
  HISTORY_PERIOD_OPTIONS,
  HISTORY_SORT_OPTIONS,
  type PurchasePageFilters,
} from '../../utils/jewelrySalesAnalytics'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  transfer: 'Havale/EFT',
  card: 'Kart',
}

interface JewelerPurchaseHistorySectionProps {
  onEdit?: (purchase: JewelryPurchase) => void
  refreshKey?: number
}

export default function JewelerPurchaseHistorySection({
  onEdit,
  refreshKey = 0,
}: JewelerPurchaseHistorySectionProps) {
  const [purchases, setPurchases] = useState<JewelryPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<JewelryPurchase | null>(null)
  const [filters, setFilters] = useState<PurchasePageFilters>(createDefaultPurchaseFilters)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPurchases(await getJewelryPurchases())
    } catch {
      setError('Alım kayıtları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  const filteredPurchases = useMemo(
    () => filterAndSortPurchases(purchases, filters),
    [purchases, filters],
  )

  const summary = useMemo(
    () => computePurchaseSummary(filteredPurchases),
    [filteredPurchases],
  )

  const paymentFilterOptions = useMemo(() => {
    const methods = [...new Set(purchases.map((purchase) => purchase.payment_method))]
    return [
      { value: '', label: 'Tüm ödemeler' },
      ...methods.map((method) => ({ value: method, label: getPaymentLabel(method) })),
    ]
  }, [purchases])

  const hasActiveFilters = (
    filters.search !== ''
    || filters.period !== createDefaultPurchaseFilters().period
    || filters.paymentMethod !== ''
    || filters.sort !== 'newest'
  )

  const resetFilters = () => setFilters(createDefaultPurchaseFilters())

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {error && <p className="alert-error">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-3">
        <PanelStatCard
          label="Filtrelenen alım"
          value={String(summary.count)}
          hint="Kayıt sayısı"
          accent="brand"
        />
        <PanelStatCard
          label="Alınan kalem"
          value={String(summary.itemCount)}
          hint={`Ortalama ${formatPanelMoney(summary.averagePurchase)}`}
          accent="amber"
        />
        <PanelStatCard
          label="Ödenen tutar"
          value={formatPanelMoney(summary.totalPaid)}
          hint="Seçili dönem"
          accent="emerald"
        />
      </section>

      <Card title={`Alım Kayıtları (${filteredPurchases.length})`}>
        <div className="mb-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <input
              type="search"
              placeholder="Alım no, ürün, müşteri..."
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className="input-field h-9 min-w-0 flex-1 px-3 text-sm"
            />
            <div className="flex flex-wrap items-center gap-1">
              {HISTORY_PERIOD_OPTIONS.map((option) => (
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <select
              value={filters.paymentMethod}
              onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}
              className="input-field h-10 px-2 md:h-9 md:text-sm"
              aria-label="Ödeme yöntemi"
            >
              {paymentFilterOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({
                ...current,
                sort: event.target.value as PurchasePageFilters['sort'],
              }))}
              className="input-field col-span-2 h-10 px-2 sm:col-span-1 md:h-9 md:text-sm"
              aria-label="Sıralama"
            >
              {HISTORY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {purchases.length === 0
              ? 'Henüz alım kaydı yok.'
              : 'Filtrelere uygun alım bulunamadı.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredPurchases.map((purchase) => {
              const itemLabels = (purchase.items ?? []).map((item) => item.item_description).join(' · ')

              return (
                <li key={purchase.id} className="flex items-stretch gap-2 py-4 sm:px-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPurchase(purchase)}
                    className="flex min-w-0 flex-1 flex-col gap-2 text-left transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:px-2 sm:py-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">#{purchase.purchase_number}</p>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          {PAYMENT_LABELS[purchase.payment_method] ?? purchase.payment_method}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(purchase.purchased_at).toLocaleString('tr-TR')}
                        {purchase.customer ? ` · ${purchase.customer.name}` : ''}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">{itemLabels}</p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-lg font-bold text-emerald-700">
                        {formatPanelMoney(Number(purchase.total))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Detay →</p>
                    </div>
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(purchase)}
                      className="shrink-0 self-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Düzenle
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {selectedPurchase && (
        <JewelryPurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onEdit={onEdit ? () => {
            onEdit(selectedPurchase)
            setSelectedPurchase(null)
          } : undefined}
        />
      )}
    </div>
  )
}
