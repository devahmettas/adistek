import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import BarcodeScannerModal from '../../components/jeweler/BarcodeScannerModal'
import Input from '../../components/Input'
import Select from '../../components/Select'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import {
  cancelJewelryStockCount,
  completeJewelryStockCount,
  getActiveJewelryStockCount,
  getJewelryStockCountHistory,
  scanJewelryStockCount,
  startJewelryStockCount,
  unscanJewelryStockCountItem,
  updateJewelryStockCountCash,
  updateJewelryStockCountItem,
  type JewelryStockCount,
  type JewelryStockCountDiscrepancy,
  type JewelryStockCountItem,
  type JewelryStockCountSummary,
} from '../../api/jeweler'
import { formatPanelMoney } from '../../components/restaurant/ManagementPanelWidgets'
import { useJewelerFeatures } from '../../hooks/useJewelerFeatures'
import {
  formatMoneyInputFromNumber,
  formatMoneyInputWhileTyping,
  parseMoneyInput,
} from '../../utils/moneyInput'
import { playBarcodeScanFeedback } from '../../utils/barcodeScanSound'
import {
  BARCODE_SCAN_MESSAGE_STYLES,
  type BarcodeScanFeedback,
} from '../../utils/barcodeScanFeedback'

function formatDifference(value: number, unit: string): string {
  const prefix = value > 0 ? '+' : ''
  if (unit === '₺') {
    return `${prefix}${formatPanelMoney(value)}`
  }
  if (unit === 'gr') {
    return `${prefix}${value.toFixed(3)} gr`
  }
  return `${prefix}${value} adet`
}

function hasStockCountEntries(count: JewelryStockCount): boolean {
  const hasProductEntries = count.items.some((item) => {
    if (item.count_mode === 'barcode') {
      return item.counted_quantity > 0
    }

    if (item.entry_type === 'weight') {
      return (item.counted_weight_gram ?? 0) > 0
    }

    return item.counted_quantity > 0
  })

  return hasProductEntries || count.counted_cash_balance !== null
}

function DiscrepancyBadge({ label }: { label: string }) {
  const isShortage = label.includes('açık')
  const isMatch = label === 'Uyumlu'

  return (
    <span
      className={
        isMatch
          ? 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700'
          : isShortage
            ? 'rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700'
            : 'rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700'
      }
    >
      {label}
    </span>
  )
}

function DiscrepancyTable({ items }: { items: JewelryStockCountDiscrepancy[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-emerald-800">Açık bulunmuyor</p>
        <p className="mt-1 text-xs text-emerald-700">Tüm sayımlar kayıtlarla uyumlu.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-card">
      <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">Açık / Fark Listesi</h3>
        <p className="mt-0.5 text-xs text-slate-500">{items.length} kayıtta fark tespit edildi</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Kalem</th>
              <th className="px-4 py-3 text-right">Kayıt</th>
              <th className="px-4 py-3 text-right">Sayım</th>
              <th className="px-4 py-3 text-right">Fark</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={`${row.type}-${row.item_id ?? row.name}`} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-600">{row.type === 'cash' ? 'Nakit' : 'Ürün'}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.name}</p>
                  {row.category_name && (
                    <p className="text-xs text-slate-500">{row.category_name}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {row.type === 'cash'
                    ? formatPanelMoney(row.expected)
                    : row.unit === 'gr'
                      ? `${row.expected.toFixed(3)} gr`
                      : `${row.expected} adet`}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {row.type === 'cash'
                    ? formatPanelMoney(row.counted)
                    : row.unit === 'gr'
                      ? `${row.counted.toFixed(3)} gr`
                      : `${row.counted} adet`}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatDifference(row.difference, row.unit)}
                </td>
                <td className="px-4 py-3">
                  <DiscrepancyBadge label={row.difference_label} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ManualItemRow({
  item,
  countId,
  onUpdated,
}: {
  item: JewelryStockCountItem
  countId: number
  onUpdated: (count: JewelryStockCount) => void
}) {
  const [value, setValue] = useState(
    item.entry_type === 'weight'
      ? String(item.counted_weight_gram ?? 0)
      : String(item.counted_quantity),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(
      item.entry_type === 'weight'
        ? String(item.counted_weight_gram ?? 0)
        : String(item.counted_quantity),
    )
  }, [item])

  const save = async () => {
    setSaving(true)
    try {
      const payload = item.entry_type === 'weight'
        ? { counted_weight_gram: Number(value) || 0 }
        : { counted_quantity: Math.max(0, Number.parseInt(value, 10) || 0) }
      const updated = await updateJewelryStockCountItem(countId, item.id, payload)
      onUpdated(updated)
    } finally {
      setSaving(false)
    }
  }

  const expectedLabel = item.entry_type === 'weight'
    ? `${(item.expected_weight_gram ?? 0).toFixed(3)} gr`
    : `${item.expected_quantity} adet`

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">
          {item.category_name ?? 'Kategori yok'} · Kayıt: {expectedLabel}
        </p>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-28">
          <Input
            label={item.entry_type === 'weight' ? 'Gram' : 'Adet'}
            type="number"
            min={0}
            step={item.entry_type === 'weight' ? '0.001' : '1'}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? '...' : 'Kaydet'}
        </Button>
      </div>
      {item.has_discrepancy && (
        <DiscrepancyBadge label={item.difference_label} />
      )}
    </div>
  )
}

function findBarcodeCountItem(
  items: JewelryStockCountItem[],
  barcode: string,
): JewelryStockCountItem | undefined {
  return items.find((item) => item.count_mode === 'barcode' && item.barcode === barcode)
}

function isBarcodeItemFullyCounted(item: JewelryStockCountItem): boolean {
  return item.counted_quantity >= item.expected_quantity
}

function formatBarcodeCountProgress(item: JewelryStockCountItem): string {
  return `${item.counted_quantity}/${item.expected_quantity}`
}

function BarcodeItemRow({
  item,
  onActivate,
  onUnscan,
  activating = false,
  unscanning = false,
}: {
  item: JewelryStockCountItem
  onActivate?: (item: JewelryStockCountItem) => void
  onUnscan?: (item: JewelryStockCountItem) => void
  activating?: boolean
  unscanning?: boolean
}) {
  const progress = item.expected_quantity > 0
    ? Math.min(100, Math.round((item.counted_quantity / item.expected_quantity) * 100))
    : item.counted_quantity > 0 ? 100 : 0

  const isComplete = isBarcodeItemFullyCounted(item)
  const canActivate = Boolean(onActivate && item.barcode && !isComplete)
  const canUnscan = Boolean(onUnscan && item.counted_quantity > 0)
  const showActions = Boolean(onActivate || onUnscan)
  const activateLabel = isComplete
    ? 'Tamamlandı'
    : item.counted_quantity > 0
      ? `Okundu işaretle (${formatBarcodeCountProgress(item)})`
      : 'Okundu işaretle'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">
            {item.barcode} · {item.category_name ?? 'Kategori yok'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {item.counted_quantity}
            <span className="text-sm font-medium text-slate-400"> / {item.expected_quantity}</span>
          </p>
          {item.has_discrepancy && <DiscrepancyBadge label={item.difference_label} />}
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${
            item.has_discrepancy ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showActions && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {onUnscan && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canUnscan || unscanning || activating}
              onClick={() => onUnscan(item)}
            >
              {unscanning ? '...' : 'Okumayı iptal et'}
            </Button>
          )}
          {onActivate && (
            <Button
              type="button"
              size="sm"
              variant={isComplete ? 'secondary' : 'primary'}
              disabled={!canActivate || activating || unscanning}
              onClick={() => onActivate(item)}
            >
              {activating ? '...' : activateLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

type StatPanelKey = 'barcode' | 'manual' | 'discrepancy'

function ClickableStatCard({
  title,
  value,
  subtitle,
  active,
  onClick,
  valueClassName = 'text-slate-900',
}: {
  title: string
  value: number | string
  subtitle: string
  active: boolean
  onClick: () => void
  valueClassName?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel-surface w-full p-4 text-left transition hover:border-brand-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        active ? 'border-brand-300 ring-2 ring-brand-200' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClassName}`}>{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <p className="mt-2 text-xs font-medium text-brand-700">{active ? 'Listeyi gizle' : 'Listeyi göster'}</p>
    </button>
  )
}

type HistoryStatusFilter = 'all' | 'completed' | 'cancelled'
type HistoryDiscrepancyFilter = 'all' | 'with' | 'without'
type HistoryPeriodFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getStartOfWeek(date: Date): Date {
  const start = getStartOfDay(date)
  const weekday = start.getDay()
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1
  start.setDate(start.getDate() - daysFromMonday)
  return start
}

function filterStockCountHistory(
  rows: JewelryStockCountSummary[],
  statusFilter: HistoryStatusFilter,
  discrepancyFilter: HistoryDiscrepancyFilter,
  periodFilter: HistoryPeriodFilter,
): JewelryStockCountSummary[] {
  const now = new Date()

  return rows.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) {
      return false
    }

    if (discrepancyFilter === 'with' && row.discrepancy_count === 0) {
      return false
    }

    if (discrepancyFilter === 'without' && row.discrepancy_count > 0) {
      return false
    }

    if (periodFilter !== 'all' && row.started_at) {
      const started = new Date(row.started_at)

      if (periodFilter === 'today') {
        const startOfToday = getStartOfDay(now)
        const startOfTomorrow = new Date(startOfToday)
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)
        return started >= startOfToday && started < startOfTomorrow
      }

      if (periodFilter === 'week') {
        return started >= getStartOfWeek(now)
      }

      if (periodFilter === 'month') {
        return started.getFullYear() === now.getFullYear() && started.getMonth() === now.getMonth()
      }

      if (periodFilter === 'quarter') {
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)
        return started >= threeMonthsAgo
      }

      if (periodFilter === 'year') {
        return started.getFullYear() === now.getFullYear()
      }
    }

    if (periodFilter !== 'all' && !row.started_at) {
      return false
    }

    return true
  })
}

function StockCountHistorySection({ history }: { history: JewelryStockCountSummary[] }) {
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all')
  const [discrepancyFilter, setDiscrepancyFilter] = useState<HistoryDiscrepancyFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<HistoryPeriodFilter>('all')

  const filteredHistory = useMemo(
    () => filterStockCountHistory(history, statusFilter, discrepancyFilter, periodFilter),
    [history, statusFilter, discrepancyFilter, periodFilter],
  )

  if (history.length === 0) {
    return null
  }

  return (
    <Card title="Geçmiş sayımlar" className="overflow-hidden p-0 [&>div:first-child]:px-5 [&>div:first-child]:pt-4">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Durum"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as HistoryStatusFilter)}
            options={[
              { value: 'all', label: 'Tümü' },
              { value: 'completed', label: 'Tamamlanan' },
              { value: 'cancelled', label: 'İptal edilen' },
            ]}
          />
          <Select
            label="Açık durumu"
            value={discrepancyFilter}
            onChange={(event) => setDiscrepancyFilter(event.target.value as HistoryDiscrepancyFilter)}
            options={[
              { value: 'all', label: 'Tümü' },
              { value: 'with', label: 'Açığı olan' },
              { value: 'without', label: 'Açıksız' },
            ]}
          />
          <Select
            label="Dönem"
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value as HistoryPeriodFilter)}
            options={[
              { value: 'all', label: 'Tüm zamanlar' },
              { value: 'today', label: 'Bugün' },
              { value: 'week', label: 'Bu hafta' },
              { value: 'month', label: 'Bu ay' },
              { value: 'quarter', label: 'Son 3 ay' },
              { value: 'year', label: 'Bu yıl' },
            ]}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {filteredHistory.length} / {history.length} kayıt gösteriliyor
        </p>
      </div>
      <div className="overflow-x-auto">
        {filteredHistory.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">Ürün</th>
                <th className="px-4 py-3 text-right">Açık</th>
                <th className="px-4 py-3 text-right">Nakit fark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-700">
                    {row.started_at
                      ? new Date(row.started_at).toLocaleString('tr-TR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{row.status_label}</td>
                  <td className="px-4 py-3 text-right">{row.item_count}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={row.discrepancy_count > 0 ? 'font-semibold text-red-700' : 'text-emerald-700'}>
                      {row.discrepancy_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.cash_difference !== null
                      ? formatDifference(row.cash_difference, '₺')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Seçilen filtrelere uygun sayım bulunamadı.</p>
        )}
      </div>
    </Card>
  )
}

function BarcodeCountSection({
  barcodeInput,
  onBarcodeInputChange,
  onBarcodeSubmit,
  onOpenScanner,
  scannerOpen,
  scanning,
  scanFeedback,
  barcodeItems,
  showItemList = true,
  onActivateBarcodeItem,
  onUnscanBarcodeItem,
  activatingItemId = null,
  unscanningItemId = null,
}: {
  barcodeInput: string
  onBarcodeInputChange: (value: string) => void
  onBarcodeSubmit: (event: FormEvent) => void
  onOpenScanner: () => void
  scannerOpen: boolean
  scanning: boolean
  scanFeedback: BarcodeScanFeedback | null
  barcodeItems: JewelryStockCountItem[]
  showItemList?: boolean
  onActivateBarcodeItem?: (item: JewelryStockCountItem) => void
  onUnscanBarcodeItem?: (item: JewelryStockCountItem) => void
  activatingItemId?: number | null
  unscanningItemId?: number | null
}) {
  return (
    <Card
      title="Barkod ile sayım"
      description={
        showItemList
          ? 'Ürünleri okutarak stok sayımı yapın.'
          : 'Hızlı okutma — ürün listesi sayfanın altında.'
      }
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={onBarcodeSubmit} className="flex min-w-0 flex-1 gap-2">
          <Input
            label="Barkod"
            value={barcodeInput}
            onChange={(event) => onBarcodeInputChange(event.target.value)}
            placeholder="Barkod numarası"
            className="flex-1"
          />
          <Button type="submit" disabled={scanning || !barcodeInput.trim()} className="self-end">
            {scanning ? '...' : 'Ekle'}
          </Button>
        </form>
        <Button
          type="button"
          variant="secondary"
          className="self-end"
          onClick={onOpenScanner}
        >
          {scannerOpen ? 'Kamera açık' : 'Kamera ile okut'}
        </Button>
      </div>

      {scanFeedback && (
        <p className={BARCODE_SCAN_MESSAGE_STYLES[scanFeedback.tone]}>{scanFeedback.message}</p>
      )}

      {showItemList && (
        barcodeItems.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {barcodeItems.map((item) => (
              <BarcodeItemRow
                key={item.id}
                item={item}
                onActivate={onActivateBarcodeItem}
                onUnscan={onUnscanBarcodeItem}
                activating={activatingItemId === item.id}
                unscanning={unscanningItemId === item.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Barkodlu ürün bulunmuyor.</p>
        )
      )}
    </Card>
  )
}

function ActiveStockCount({
  count,
  onCountChange,
  onCompleted,
  barcodeEnabled,
}: {
  count: JewelryStockCount
  onCountChange: (count: JewelryStockCount) => void
  onCompleted: () => void
  barcodeEnabled: boolean
}) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanFeedback, setScanFeedback] = useState<BarcodeScanFeedback | null>(null)
  const [cashInput, setCashInput] = useState(
    count.counted_cash_balance !== null
      ? formatMoneyInputFromNumber(count.counted_cash_balance)
      : '',
  )
  const [cashSaving, setCashSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<StatPanelKey | null>(null)
  const [activatingItemId, setActivatingItemId] = useState<number | null>(null)
  const [unscanningItemId, setUnscanningItemId] = useState<number | null>(null)
  const scanQueueRef = useRef<Array<{ code: string; resolve: (feedback: BarcodeScanFeedback | null) => void }>>([])
  const processingScanRef = useRef(false)
  const countRef = useRef(count)

  useEffect(() => {
    countRef.current = count
  }, [count])

  const manualItems = useMemo(
    () => count.items.filter((item) => item.count_mode === 'manual'),
    [count.items],
  )

  const barcodeItems = useMemo(
    () => count.items.filter((item) => item.count_mode === 'barcode'),
    [count.items],
  )

  const scannedTotal = useMemo(
    () => barcodeItems.reduce((sum, item) => sum + item.counted_quantity, 0),
    [barcodeItems],
  )

  const processScanQueue = useCallback(async () => {
    if (processingScanRef.current) return

    processingScanRef.current = true
    setScanning(true)
    setError(null)

    while (scanQueueRef.current.length > 0) {
      const job = scanQueueRef.current.shift()
      if (!job) continue

      const trimmed = job.code.trim()
      if (!trimmed) {
        job.resolve(null)
        continue
      }

      setScanFeedback(null)

      const existingItem = findBarcodeCountItem(countRef.current.items, trimmed)
      if (existingItem && isBarcodeItemFullyCounted(existingItem)) {
        const feedback: BarcodeScanFeedback = {
          message: `${existingItem.name} tamamlandı (${formatBarcodeCountProgress(existingItem)})`,
          tone: 'warning',
        }
        setScanFeedback(feedback)
        void playBarcodeScanFeedback('warning')
        job.resolve(feedback)
        continue
      }

      try {
        const updated = await scanJewelryStockCount(countRef.current.id, trimmed)
        onCountChange(updated)
        countRef.current = updated
        const item = findBarcodeCountItem(updated.items, trimmed)
        const productName = item?.name ?? 'Ürün'
        const feedback: BarcodeScanFeedback = {
          message: item
            ? `${productName} okundu (${formatBarcodeCountProgress(item)})`
            : `${productName} okundu`,
          tone: 'success',
        }
        setScanFeedback(feedback)
        setBarcodeInput('')
        void playBarcodeScanFeedback('success')
        job.resolve(feedback)
      } catch {
        const feedback: BarcodeScanFeedback = {
          message: 'Stokta yok',
          tone: 'error',
        }
        setScanFeedback(feedback)
        void playBarcodeScanFeedback('error')
        job.resolve(feedback)
      }
    }

    processingScanRef.current = false
    setScanning(false)
  }, [onCountChange])

  const handleScan = useCallback((code: string): Promise<BarcodeScanFeedback | null> => {
    const trimmed = code.trim()
    if (!trimmed) return Promise.resolve(null)

    return new Promise((resolve) => {
      scanQueueRef.current.push({ code: trimmed, resolve })
      void processScanQueue()
    })
  }, [processScanQueue])

  const handleBarcodeSubmit = (event: FormEvent) => {
    event.preventDefault()
    void handleScan(barcodeInput)
  }

  const togglePanel = (panel: StatPanelKey) => {
    setActivePanel((current) => (current === panel ? null : panel))
  }

  const handleActivateBarcodeItem = async (item: JewelryStockCountItem) => {
    if (!item.barcode || isBarcodeItemFullyCounted(item)) {
      if (isBarcodeItemFullyCounted(item)) {
        setScanFeedback({
          message: `${item.name} tamamlandı (${formatBarcodeCountProgress(item)})`,
          tone: 'warning',
        })
        void playBarcodeScanFeedback('warning')
      }
      return
    }

    setActivatingItemId(item.id)
    setError(null)

    try {
      const updated = await scanJewelryStockCount(count.id, item.barcode)
      onCountChange(updated)
      countRef.current = updated
      const updatedItem = updated.items.find((row) => row.id === item.id)
      setScanFeedback({
        message: updatedItem
          ? `${item.name} okundu (${formatBarcodeCountProgress(updatedItem)})`
          : `${item.name} okundu`,
        tone: 'success',
      })
      void playBarcodeScanFeedback('success')
    } catch {
      const feedback: BarcodeScanFeedback = {
        message: 'Stokta yok',
        tone: 'error',
      }
      setScanFeedback(feedback)
      void playBarcodeScanFeedback('error')
    } finally {
      setActivatingItemId(null)
    }
  }

  const handleUnscanBarcodeItem = async (item: JewelryStockCountItem) => {
    if (item.counted_quantity <= 0) return

    setUnscanningItemId(item.id)
    setError(null)

    try {
      const updated = await unscanJewelryStockCountItem(count.id, item.id)
      onCountChange(updated)
      countRef.current = updated
      const updatedItem = updated.items.find((row) => row.id === item.id)
      setScanFeedback({
        message: updatedItem
          ? `${item.name} okuması iptal edildi (${formatBarcodeCountProgress(updatedItem)})`
          : `${item.name} okuması iptal edildi`,
        tone: 'warning',
      })
    } catch {
      setError('Okuma iptal edilemedi.')
    } finally {
      setUnscanningItemId(null)
    }
  }

  const saveCash = async () => {
    const amount = parseMoneyInput(cashInput)
    if (Number.isNaN(amount)) {
      setError('Geçerli bir nakit tutarı girin.')
      return
    }

    setCashSaving(true)
    setError(null)
    try {
      const updated = await updateJewelryStockCountCash(count.id, amount)
      onCountChange(updated)
    } catch {
      setError('Nakit tutarı kaydedilemedi.')
    } finally {
      setCashSaving(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    setError(null)
    try {
      await completeJewelryStockCount(count.id)
      onCompleted()
    } catch {
      setError('Sayım tamamlanamadı. Nakit girişi yapıldığından emin olun.')
    } finally {
      setCompleting(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Devam eden sayım iptal edilsin mi?')) return

    setCancelling(true)
    try {
      await cancelJewelryStockCount(count.id)
      onCompleted()
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void handleComplete()} disabled={completing}>
          {completing ? 'Tamamlanıyor...' : 'Sayımı tamamla'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => void handleCancel()} disabled={cancelling}>
          {cancelling ? 'İptal...' : 'Sayımı iptal et'}
        </Button>
      </div>

      {barcodeEnabled && (
      <BarcodeCountSection
        barcodeInput={barcodeInput}
        onBarcodeInputChange={setBarcodeInput}
        onBarcodeSubmit={handleBarcodeSubmit}
        onOpenScanner={() => setScannerOpen(true)}
        scannerOpen={scannerOpen}
        scanning={scanning}
        scanFeedback={scanFeedback}
        barcodeItems={barcodeItems}
        showItemList={false}
      />
      )}

      <div className={`grid gap-4 ${barcodeEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {barcodeEnabled && (
        <ClickableStatCard
          title="Barkodlu ürün"
          value={barcodeItems.length}
          subtitle={`${scannedTotal} adet okutuldu`}
          active={activePanel === 'barcode'}
          onClick={() => togglePanel('barcode')}
        />
        )}
        <ClickableStatCard
          title="Elle giriş"
          value={manualItems.length}
          subtitle="Gram / çeyrek altın"
          active={activePanel === 'manual'}
          onClick={() => togglePanel('manual')}
        />
        <ClickableStatCard
          title="Açık sayısı"
          value={count.discrepancy_count}
          subtitle="Ürün ve nakit farkları"
          active={activePanel === 'discrepancy'}
          onClick={() => togglePanel('discrepancy')}
          valueClassName={count.discrepancy_count > 0 ? 'text-red-700' : 'text-emerald-700'}
        />
      </div>

      {barcodeEnabled && activePanel === 'barcode' && (
        <Card title="Barkodlu ürünler" description="Aynı barkodu stok adedi kadar okutun. Örn. 3 adet varsa 3 kez okutun veya butona basın." className="space-y-4">
          {barcodeItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {barcodeItems.map((item) => (
                <BarcodeItemRow
                  key={item.id}
                  item={item}
                  onActivate={(row) => void handleActivateBarcodeItem(row)}
                  onUnscan={(row) => void handleUnscanBarcodeItem(row)}
                  activating={activatingItemId === item.id}
                  unscanning={unscanningItemId === item.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Barkodlu ürün bulunmuyor.</p>
          )}
        </Card>
      )}

      {activePanel === 'manual' && (
        <Card
          title="Elle giriş (Gram / Çeyrek)"
          description="Gram altın için ağırlık, çeyrek için adet girin."
          className="space-y-4"
        >
          {manualItems.length > 0 ? (
            <div className="space-y-3">
              {manualItems.map((item) => (
                <ManualItemRow
                  key={item.id}
                  item={item}
                  countId={count.id}
                  onUpdated={onCountChange}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Elle giriş gereken ürün bulunmuyor.</p>
          )}
        </Card>
      )}

      {activePanel === 'discrepancy' && (
        <Card title="Açık / fark listesi" description="Kayıt ile sayım arasında fark olan kalemler." className="space-y-4">
          <DiscrepancyTable items={count.discrepancies} />
        </Card>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <Card
        title="Nakit kasa sayımı"
        description={`Kayıtlı bakiye: ${formatPanelMoney(count.expected_cash_balance)}`}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Sayılan nakit (₺)"
              value={cashInput}
              onChange={(event) => setCashInput(formatMoneyInputWhileTyping(event.target.value))}
              placeholder="0,00"
            />
          </div>
          <Button type="button" onClick={() => void saveCash()} disabled={cashSaving}>
            {cashSaving ? 'Kaydediliyor...' : 'Nakit kaydet'}
          </Button>
        </div>
        {count.counted_cash_balance !== null && count.cash_difference !== null && (
          <p className="text-sm text-slate-600">
            Fark: {formatDifference(count.cash_difference, '₺')}
            {' · '}
            <DiscrepancyBadge
              label={Math.abs(count.cash_difference) < 0.01 ? 'Uyumlu' : count.cash_difference < 0 ? 'Nakit açık' : 'Nakit fazla'}
            />
          </p>
        )}
      </Card>

      {barcodeEnabled && (
      <BarcodeCountSection
        barcodeInput={barcodeInput}
        onBarcodeInputChange={setBarcodeInput}
        onBarcodeSubmit={handleBarcodeSubmit}
        onOpenScanner={() => setScannerOpen(true)}
        scannerOpen={scannerOpen}
        scanning={scanning}
        scanFeedback={scanFeedback}
        barcodeItems={barcodeItems}
        showItemList
        onActivateBarcodeItem={(row) => void handleActivateBarcodeItem(row)}
        onUnscanBarcodeItem={(row) => void handleUnscanBarcodeItem(row)}
        activatingItemId={activatingItemId}
        unscanningItemId={unscanningItemId}
      />
      )}

      {barcodeEnabled && scannerOpen && (
        <BarcodeScannerModal
          continuous
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

export default function JewelerStockCountPage() {
  const { barcodeEnabled } = useJewelerFeatures()
  const [activeCount, setActiveCount] = useState<JewelryStockCount | null>(null)
  const activeCountRef = useRef<JewelryStockCount | null>(null)
  const [history, setHistory] = useState<JewelryStockCountSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [active, past] = await Promise.all([
        getActiveJewelryStockCount(),
        getJewelryStockCountHistory(),
      ])
      setActiveCount(active)
      setHistory(past.filter((row) => row.status !== 'draft'))
    } catch {
      setError('Stok sayım bilgileri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    activeCountRef.current = activeCount
  }, [activeCount])

  useEffect(() => {
    return () => {
      const count = activeCountRef.current
      if (count && !hasStockCountEntries(count)) {
        void cancelJewelryStockCount(count.id).catch(() => {})
      }
    }
  }, [])

  const startCount = async () => {
    setStarting(true)
    setError(null)
    try {
      const count = await startJewelryStockCount()
      setActiveCount(count)
      await load()
    } catch {
      setError('Stok sayımı başlatılamadı.')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <LoadingState label="Stok takip yükleniyor..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Takip"
        description="Mevcut ürünleri kayıt altına alın, barkod okutarak veya elle sayarak stok ve nakit açıklarını tespit edin."
        actions={
          !activeCount ? (
            <Button type="button" onClick={() => void startCount()} disabled={starting}>
              {starting ? 'Başlatılıyor...' : 'Sayım başlat'}
            </Button>
          ) : undefined
        }
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {activeCount && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          role="status"
        >
          <p className="text-sm font-semibold text-amber-900">
            {hasStockCountEntries(activeCount) ? 'Sayım yarıda kaldı' : 'Devam eden sayım'}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {activeCount.started_at && (
              <>
                Başlangıç: {new Date(activeCount.started_at).toLocaleString('tr-TR')}
                {' · '}
              </>
            )}
            {hasStockCountEntries(activeCount)
              ? 'Kaldığınız yerden sayıma devam edebilirsiniz.'
              : 'Sayım başlatıldı, henüz giriş yapılmadı.'}
          </p>
        </div>
      )}

      {activeCount ? (
        <ActiveStockCount
          count={activeCount}
          barcodeEnabled={barcodeEnabled}
          onCountChange={setActiveCount}
          onCompleted={() => void load()}
        />
      ) : (
        <Card
          title="Yeni stok sayımı"
          description={
            barcodeEnabled
              ? 'Sayım başlatıldığında tüm aktif ürünler ve nakit bakiyesi kayıt altına alınır. Barkodlu ürünler okutularak, gram ve çeyrek altınlar elle girilerek sayılır.'
              : 'Sayım başlatıldığında tüm aktif ürünler ve nakit bakiyesi kayıt altına alınır. Gram ve çeyrek altınlar elle girilerek sayılır.'
          }
        >
          <Button type="button" onClick={() => void startCount()} disabled={starting}>
            {starting ? 'Başlatılıyor...' : 'Sayım başlat'}
          </Button>
        </Card>
      )}

      {history.length > 0 && <StockCountHistorySection history={history} />}
    </div>
  )
}
