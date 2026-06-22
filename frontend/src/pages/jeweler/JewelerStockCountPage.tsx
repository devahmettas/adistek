import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import BarcodeScannerModal from '../../components/jeweler/BarcodeScannerModal'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import {
  cancelJewelryStockCount,
  completeJewelryStockCount,
  getActiveJewelryStockCount,
  getJewelryStockCountHistory,
  scanJewelryStockCount,
  startJewelryStockCount,
  updateJewelryStockCountCash,
  updateJewelryStockCountItem,
  type JewelryStockCount,
  type JewelryStockCountDiscrepancy,
  type JewelryStockCountItem,
  type JewelryStockCountSummary,
} from '../../api/jeweler'
import { formatPanelMoney } from '../../components/restaurant/ManagementPanelWidgets'
import {
  formatMoneyInputFromNumber,
  formatMoneyInputWhileTyping,
  parseMoneyInput,
} from '../../utils/moneyInput'

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

function BarcodeItemRow({ item }: { item: JewelryStockCountItem }) {
  const progress = item.expected_quantity > 0
    ? Math.min(100, Math.round((item.counted_quantity / item.expected_quantity) * 100))
    : item.counted_quantity > 0 ? 100 : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
    </div>
  )
}

function BarcodeCountSection({
  barcodeInput,
  onBarcodeInputChange,
  onBarcodeSubmit,
  onOpenScanner,
  scannerOpen,
  scanning,
  scanMessage,
  barcodeItems,
  showItemList = true,
}: {
  barcodeInput: string
  onBarcodeInputChange: (value: string) => void
  onBarcodeSubmit: (event: FormEvent) => void
  onOpenScanner: () => void
  scannerOpen: boolean
  scanning: boolean
  scanMessage: string | null
  barcodeItems: JewelryStockCountItem[]
  showItemList?: boolean
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

      {scanMessage && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{scanMessage}</p>
      )}

      {showItemList && (
        barcodeItems.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {barcodeItems.map((item) => (
              <BarcodeItemRow key={item.id} item={item} />
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
}: {
  count: JewelryStockCount
  onCountChange: (count: JewelryStockCount) => void
  onCompleted: () => void
}) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [cashInput, setCashInput] = useState(
    count.counted_cash_balance !== null
      ? formatMoneyInputFromNumber(count.counted_cash_balance)
      : '',
  )
  const [cashSaving, setCashSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scanQueueRef = useRef<string[]>([])
  const processingScanRef = useRef(false)

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
      const trimmed = scanQueueRef.current.shift()?.trim() ?? ''
      if (!trimmed) continue

      setScanMessage(null)

      try {
        const updated = await scanJewelryStockCount(count.id, trimmed)
        onCountChange(updated)
        const item = updated.items.find((row) => row.barcode === trimmed)
        setScanMessage(item ? `${item.name} sayıldı (${item.counted_quantity})` : 'Ürün sayıldı.')
        setBarcodeInput('')
      } catch {
        setError('Barkod okunamadı veya ürün listede yok.')
      }
    }

    processingScanRef.current = false
    setScanning(false)
  }, [count.id, onCountChange])

  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return

    scanQueueRef.current.push(trimmed)
    void processScanQueue()
  }, [processScanQueue])

  const handleBarcodeSubmit = (event: FormEvent) => {
    event.preventDefault()
    void handleScan(barcodeInput)
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

      <BarcodeCountSection
        barcodeInput={barcodeInput}
        onBarcodeInputChange={setBarcodeInput}
        onBarcodeSubmit={handleBarcodeSubmit}
        onOpenScanner={() => setScannerOpen(true)}
        scannerOpen={scannerOpen}
        scanning={scanning}
        scanMessage={scanMessage}
        barcodeItems={barcodeItems}
        showItemList={false}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Barkodlu ürün</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{barcodeItems.length}</p>
          <p className="text-xs text-slate-500">{scannedTotal} adet okutuldu</p>
        </div>
        <div className="panel-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Elle giriş</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{manualItems.length}</p>
          <p className="text-xs text-slate-500">Gram / çeyrek altın</p>
        </div>
        <div className="panel-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Açık sayısı</p>
          <p className={`mt-1 text-2xl font-bold ${count.discrepancy_count > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {count.discrepancy_count}
          </p>
          <p className="text-xs text-slate-500">Ürün ve nakit farkları</p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {manualItems.length > 0 && (
        <Card
          title="Elle giriş (Gram / Çeyrek)"
          description="Gram altın için ağırlık, çeyrek için adet girin."
          className="space-y-4"
        >
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
        </Card>
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

      <DiscrepancyTable items={count.discrepancies} />

      <BarcodeCountSection
        barcodeInput={barcodeInput}
        onBarcodeInputChange={setBarcodeInput}
        onBarcodeSubmit={handleBarcodeSubmit}
        onOpenScanner={() => setScannerOpen(true)}
        scannerOpen={scannerOpen}
        scanning={scanning}
        scanMessage={scanMessage}
        barcodeItems={barcodeItems}
        showItemList
      />

      {scannerOpen && (
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
          onCountChange={setActiveCount}
          onCompleted={() => void load()}
        />
      ) : (
        <Card
          title="Yeni stok sayımı"
          description="Sayım başlatıldığında tüm aktif ürünler ve nakit bakiyesi kayıt altına alınır. Barkodlu ürünler okutularak, gram ve çeyrek altınlar elle girilerek sayılır."
        >
          <Button type="button" onClick={() => void startCount()} disabled={starting}>
            {starting ? 'Başlatılıyor...' : 'Sayım başlat'}
          </Button>
        </Card>
      )}

      {history.length > 0 && (
        <Card title="Geçmiş sayımlar" className="overflow-hidden p-0 [&>div:first-child]:px-5 [&>div:first-child]:pt-4">
          <div className="overflow-x-auto">
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
                {history.map((row) => (
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
          </div>
        </Card>
      )}
    </div>
  )
}
