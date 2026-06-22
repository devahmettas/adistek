import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  getJewelerStats,
  getJewelrySettings,
  type JewelerStats,
  type JewelerStatsPeriod,
  type JewelryCashSessionSummary,
  type JewelryStockCountSummary,
} from '../../api/jeweler'
import Button from '../../components/Button'
import LoadingState from '../../components/LoadingState'
import StatsBarChart from '../../components/jeweler/StatsBarChart'
import StatsTrendChart from '../../components/jeweler/StatsTrendChart'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'
import { useAuth } from '../../store/AuthStore'
import { downloadJewelerReportPdf } from '../../utils/jewelerReportPdf'

type ReportTab = 'overview' | 'sales' | 'stock' | 'cash' | 'inventory'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale/EFT',
  gold_exchange: 'Altın Takas',
}

const PERIOD_OPTIONS: Array<{ value: JewelerStatsPeriod; label: string }> = [
  { value: 'day', label: 'Günlük' },
  { value: 'week', label: 'Haftalık' },
  { value: 'month', label: 'Aylık' },
]

const TAB_OPTIONS: Array<{ value: ReportTab; label: string; icon: string }> = [
  { value: 'overview', label: 'Genel Bakış', icon: '◎' },
  { value: 'sales', label: 'Satış', icon: '₺' },
  { value: 'stock', label: 'Stok Takip', icon: '▧' },
  { value: 'cash', label: 'Gün Sonu', icon: '▤' },
  { value: 'inventory', label: 'Envanter', icon: '◆' },
]

function trendTitle(period: JewelerStatsPeriod): string {
  if (period === 'day') return 'Bugünkü saatlik satış trendi'
  if (period === 'week') return 'Son 7 gün satış trendi'
  return 'Son 30 gün satış trendi'
}

function formatDateRange(start: string, end: string): string {
  if (start === end) {
    return new Date(`${start}T00:00:00`).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return `${new Date(`${start}T00:00:00`).toLocaleDateString('tr-TR')} – ${new Date(`${end}T00:00:00`).toLocaleDateString('tr-TR')}`
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('tr-TR')
}

function DifferenceBadge({ value, balancedLabel = 'Uyumlu' }: { value: number | null; balancedLabel?: string }) {
  if (value === null) {
    return <span className="text-slate-400">—</span>
  }

  if (Math.abs(value) < 0.01) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        {balancedLabel}
      </span>
    )
  }

  if (value < 0) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        {formatPanelMoney(Math.abs(value))} eksik
      </span>
    )
  }

  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      {formatPanelMoney(value)} fazla
    </span>
  )
}

function ReportPanel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function EmptyReportState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

export default function JewelerReportsPage() {
  const { restaurant } = useAuth()
  const [period, setPeriod] = useState<JewelerStatsPeriod>('month')
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [stats, setStats] = useState<JewelerStats | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await getJewelerStats(period))
    } catch {
      setError('Raporlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void getJewelrySettings()
      .then((settings) => setCompanyName(settings.company_name))
      .catch(() => undefined)
  }, [])

  const handleDownloadPdf = async () => {
    if (!stats) return
    setDownloading(true)
    try {
      await downloadJewelerReportPdf(stats, {
        companyName,
        restaurantName: restaurant?.name,
      })
    } catch {
      setError('PDF indirilemedi. Lütfen tekrar deneyin.')
    } finally {
      setDownloading(false)
    }
  }

  const periodSummary = stats?.period_summary
  const stockReport = stats?.stock_counts
  const cashReport = stats?.cash_sessions

  const overviewHighlights = useMemo(() => {
    if (!stats || !periodSummary) return []

    return [
      {
        label: 'Ciro',
        value: formatPanelMoney(periodSummary.revenue),
        hint: `${periodSummary.sales_count} satış`,
        accent: 'amber' as const,
      },
      {
        label: 'Net kar',
        value: formatPanelMoney(periodSummary.profit),
        hint: `Marj %${periodSummary.profit_margin}`,
        accent: 'emerald' as const,
      },
      {
        label: 'Stok sayımı',
        value: String(stockReport?.summary.completed_count ?? 0),
        hint: `%${stockReport?.summary.accuracy_rate ?? 100} uyum`,
        accent: 'brand' as const,
      },
      {
        label: 'Gün sonu',
        value: String(cashReport?.summary.closed_count ?? 0),
        hint: cashReport?.is_open ? 'Kasa açık' : 'Kasa kapalı',
        accent: 'violet' as const,
      },
    ]
  }, [stats, periodSummary, stockReport, cashReport])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 py-7 text-white shadow-panel lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              İşletme Raporları
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              {companyName?.trim() || restaurant?.name || 'Raporlama Merkezi'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Satış performansı, stok takip sayımları ve gün sonu kasa kapanışlarını tek panelden izleyin.
            </p>
            {stats && (
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-200">
                <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {stats.period_label}
                </span>
                <span>{formatDateRange(stats.date_range.start, stats.date_range.end)}</span>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="inline-flex w-full rounded-xl border border-white/10 bg-white/10 p-1 backdrop-blur sm:w-auto">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`min-h-10 flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                    period === option.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
              disabled={!stats || loading || downloading}
              onClick={() => void handleDownloadPdf()}
            >
              {downloading ? 'PDF hazırlanıyor…' : 'PDF İndir'}
            </Button>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
        <div className="flex min-w-max gap-1">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.value
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {loading && <LoadingState label="Raporlar hazırlanıyor..." />}
      {error && <p className="alert-error">{error}</p>}

      {stats && periodSummary && !loading && (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              periodSummary={periodSummary}
              highlights={overviewHighlights}
              stockReport={stockReport}
              cashReport={cashReport}
            />
          )}

          {activeTab === 'sales' && (
            <SalesTab stats={stats} periodSummary={periodSummary} />
          )}

          {activeTab === 'stock' && stockReport && (
            <StockTab stockReport={stockReport} periodLabel={stats.period_label} />
          )}

          {activeTab === 'cash' && cashReport && (
            <CashTab cashReport={cashReport} periodLabel={stats.period_label} />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab stats={stats} />
          )}
        </>
      )}
    </div>
  )
}

function OverviewTab({
  stats,
  periodSummary,
  highlights,
  stockReport,
  cashReport,
}: {
  stats: JewelerStats
  periodSummary: JewelerStats['period_summary']
  highlights: Array<{
    label: string
    value: string
    hint: string
    accent: 'amber' | 'emerald' | 'brand' | 'violet'
  }>
  stockReport: JewelerStats['stock_counts'] | undefined
  cashReport: JewelerStats['cash_sessions'] | undefined
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <PanelStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            accent={item.accent}
          />
        ))}
      </div>

      <StatsTrendChart
        title={trendTitle(stats.period)}
        points={stats.revenue_trend}
        valueFormatter={formatPanelMoney}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportPanel
          title="Stok takip özeti"
          description={`${stats.period_label} dönemindeki sayım performansı`}
          action={(
            <Link to="/dashboard/jeweler/stock-count" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Stok takibe git →
            </Link>
          )}
        >
          {stockReport ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Tamamlanan sayım" value={String(stockReport.summary.completed_count)} />
              <MiniMetric label="Uyum oranı" value={`%${stockReport.summary.accuracy_rate}`} />
              <MiniMetric label="Farklı sayım" value={String(stockReport.summary.counts_with_discrepancy)} />
              <MiniMetric
                label="Nakit fark toplamı"
                value={formatPanelMoney(stockReport.summary.cash_discrepancy_total)}
              />
            </div>
          ) : (
            <EmptyReportState message="Stok takip verisi bulunamadı." />
          )}
        </ReportPanel>

        <ReportPanel
          title="Gün sonu özeti"
          description={`${stats.period_label} dönemindeki kasa kapanışları`}
          action={(
            <Link to="/dashboard/jeweler/vault" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Kasa yönetimine git →
            </Link>
          )}
        >
          {cashReport ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Kapanış sayısı" value={String(cashReport.summary.closed_count)} />
              <MiniMetric
                label="Kasa durumu"
                value={cashReport.is_open ? 'Açık' : 'Kapalı'}
              />
              <MiniMetric label="Nakit satış" value={formatPanelMoney(cashReport.summary.total_cash_sales)} />
              <MiniMetric
                label="Toplam fark"
                value={formatPanelMoney(cashReport.summary.total_cash_difference)}
              />
            </div>
          ) : (
            <EmptyReportState message="Gün sonu verisi bulunamadı." />
          )}
        </ReportPanel>
      </div>

      <ReportPanel title="Dönem performansı" description="Satış ve envanter göstergeleri">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PanelStatCard
            label="Ortalama sepet"
            value={formatPanelMoney(periodSummary.average_sale)}
            hint={`${periodSummary.sales_with_customer} kayıtlı müşteri satışı`}
            accent="brand"
          />
          <PanelStatCard
            label="Stok değeri"
            value={formatPanelMoney(stats.inventory.inventory_sale_value)}
            hint={`${stats.inventory.total_stock_units} adet`}
            accent="amber"
          />
          <PanelStatCard
            label="Düşük stok"
            value={String(stats.inventory.low_stock_count)}
            hint={`${stats.inventory.out_of_stock_count} tükenen`}
            accent="violet"
          />
          <PanelStatCard
            label="Toplam gram"
            value={`${stats.inventory.total_weight_gram.toLocaleString('tr-TR')} gr`}
            hint={`${stats.inventory.total_products} ürün çeşidi`}
            accent="emerald"
          />
        </div>
      </ReportPanel>
    </div>
  )
}

function SalesTab({
  stats,
  periodSummary,
}: {
  stats: JewelerStats
  periodSummary: JewelerStats['period_summary']
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PanelStatCard
          label="Ciro"
          value={formatPanelMoney(periodSummary.revenue)}
          hint={`${periodSummary.sales_count} satış`}
          accent="amber"
        />
        <PanelStatCard
          label="Net kar"
          value={formatPanelMoney(periodSummary.profit)}
          hint={`Maliyet ${formatPanelMoney(periodSummary.cost)}`}
          accent="emerald"
        />
        <PanelStatCard
          label="Kar marjı"
          value={`%${periodSummary.profit_margin}`}
          hint="FIFO maliyet bazlı"
          accent="brand"
        />
        <PanelStatCard
          label="Müşteri kayıtlı"
          value={String(periodSummary.sales_with_customer)}
          hint={`${stats.customers.total_count} toplam müşteri`}
          accent="violet"
        />
      </div>

      <StatsTrendChart
        title={trendTitle(stats.period)}
        points={stats.revenue_trend}
        valueFormatter={formatPanelMoney}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <StatsBarChart
          title={`${stats.period_label} en çok satan ürünler`}
          items={stats.top_products.map((product) => ({
            label: product.product_name,
            value: product.revenue,
            hint: `${product.quantity} adet`,
          }))}
          valueFormatter={formatPanelMoney}
          accentHex="#f59e0b"
        />
        <StatsBarChart
          title={`${stats.period_label} kategori bazlı satış`}
          items={stats.category_breakdown.map((row) => ({
            label: row.category_name,
            value: row.revenue,
            hint: `${row.quantity} adet`,
          }))}
          valueFormatter={formatPanelMoney}
          colorClass="bg-brand-500"
          accentHex="#0f766e"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StatsBarChart
          title={`${stats.period_label} ödeme dağılımı`}
          items={stats.payment_breakdown.map((row) => ({
            label: PAYMENT_LABELS[row.payment_method] ?? row.payment_method,
            value: row.total,
            hint: `${row.count} işlem`,
          }))}
          valueFormatter={formatPanelMoney}
          colorClass="bg-emerald-500"
          accentHex="#059669"
        />

        <ReportPanel title="Karlılık detayı" description="FIFO maliyet bazlı hesaplama">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Ciro', value: formatPanelMoney(periodSummary.revenue) },
              { label: 'Maliyet', value: formatPanelMoney(periodSummary.cost) },
              { label: 'Net kar', value: formatPanelMoney(periodSummary.profit) },
              { label: 'Kar marjı', value: `%${periodSummary.profit_margin}` },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
              </li>
            ))}
          </ul>
        </ReportPanel>
      </div>
    </div>
  )
}

function StockTab({
  stockReport,
  periodLabel,
}: {
  stockReport: JewelerStats['stock_counts']
  periodLabel: string
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PanelStatCard
          label="Tamamlanan sayım"
          value={String(stockReport.summary.completed_count)}
          hint={`${periodLabel} dönemi`}
          accent="brand"
        />
        <PanelStatCard
          label="Uyum oranı"
          value={`%${stockReport.summary.accuracy_rate}`}
          hint={`${stockReport.summary.counts_with_discrepancy} farklı sayım`}
          accent="emerald"
        />
        <PanelStatCard
          label="Toplam fark kalemi"
          value={String(stockReport.summary.total_discrepancy_items)}
          hint="Ürün ve nakit farkları"
          accent="amber"
        />
        <PanelStatCard
          label="Nakit fark toplamı"
          value={formatPanelMoney(stockReport.summary.cash_discrepancy_total)}
          hint={`${stockReport.summary.cancelled_count} iptal`}
          accent="violet"
        />
      </div>

      {stockReport.active_count && (
        <ReportPanel
          title="Devam eden sayım"
          description="Henüz tamamlanmamış stok takip oturumu"
          action={(
            <Link to="/dashboard/jeweler/stock-count">
              <Button type="button" size="sm">Sayıma devam et</Button>
            </Link>
          )}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Başlangıç" value={formatDateTime(stockReport.active_count.started_at)} />
            <MiniMetric label="Kalem sayısı" value={String(stockReport.active_count.item_count)} />
            <MiniMetric label="Tespit edilen fark" value={String(stockReport.active_count.discrepancy_count)} />
          </div>
        </ReportPanel>
      )}

      <ReportPanel
        title="Stok sayım geçmişi"
        description={`${periodLabel} döneminde tamamlanan sayımlar`}
      >
        {stockReport.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tamamlanma</th>
                  <th className="px-4 py-3 text-right">Kalem</th>
                  <th className="px-4 py-3 text-right">Fark</th>
                  <th className="px-4 py-3 text-right">Kayıtlı nakit</th>
                  <th className="px-4 py-3 text-right">Sayılan nakit</th>
                  <th className="px-4 py-3">Nakit durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockReport.recent.map((count) => (
                  <StockCountReportRow key={count.id} count={count} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyReportState message="Bu dönemde tamamlanmış stok sayımı bulunmuyor." />
        )}
      </ReportPanel>
    </div>
  )
}

function CashTab({
  cashReport,
  periodLabel,
}: {
  cashReport: JewelerStats['cash_sessions']
  periodLabel: string
}) {
  return (
    <div className="space-y-6">
      <div className={`overflow-hidden rounded-2xl border px-6 py-5 ${
        cashReport.is_open
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white'
          : 'border-slate-200 bg-gradient-to-r from-slate-50 to-white'
      }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              cashReport.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}
            >
              {cashReport.is_open ? 'Kasa şu an açık' : 'Kasa şu an kapalı'}
            </span>
            <p className="mt-3 text-lg font-bold text-slate-900">
              {cashReport.is_open && cashReport.active_session
                ? `Beklenen bakiye: ${formatPanelMoney(cashReport.active_session.expected_balance ?? cashReport.active_session.opening_balance)}`
                : 'Yeni iş günü için kasa açılışı yapılabilir'}
            </p>
            {cashReport.active_session && (
              <p className="mt-1 text-sm text-slate-600">
                Açılış: {formatDateTime(cashReport.active_session.opened_at)} ·
                {' '}Nakit satış: {formatPanelMoney(cashReport.active_session.cash_sale_total)}
              </p>
            )}
          </div>
          <Link to="/dashboard/jeweler/vault">
            <Button type="button">
              {cashReport.is_open ? 'Gün sonu al' : 'Kasa açılışı yap'}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PanelStatCard
          label="Kapanış sayısı"
          value={String(cashReport.summary.closed_count)}
          hint={periodLabel}
          accent="brand"
        />
        <PanelStatCard
          label="Nakit giriş"
          value={formatPanelMoney(cashReport.summary.total_cash_in)}
          hint={`Çıkış ${formatPanelMoney(cashReport.summary.total_cash_out)}`}
          accent="emerald"
        />
        <PanelStatCard
          label="Nakit satış"
          value={formatPanelMoney(cashReport.summary.total_cash_sales)}
          hint="Dönem toplamı"
          accent="amber"
        />
        <PanelStatCard
          label="Toplam fark"
          value={formatPanelMoney(cashReport.summary.total_cash_difference)}
          hint={`${cashReport.summary.balanced_count} uyumlu kapanış`}
          accent="violet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniMetric label="Uyumlu kapanış" value={String(cashReport.summary.balanced_count)} />
        <MiniMetric label="Eksikli kapanış" value={String(cashReport.summary.shortage_count)} />
        <MiniMetric label="Fazlalı kapanış" value={String(cashReport.summary.surplus_count)} />
      </div>

      <ReportPanel title="Gün sonu geçmişi" description={`${periodLabel} döneminde kapanan kasalar`}>
        {cashReport.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kapanış</th>
                  <th className="px-4 py-3 text-right">Açılış</th>
                  <th className="px-4 py-3 text-right">Beklenen</th>
                  <th className="px-4 py-3 text-right">Sayılan</th>
                  <th className="px-4 py-3 text-right">Fark</th>
                  <th className="px-4 py-3 text-right">Nakit satış</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashReport.recent.map((session) => (
                  <CashSessionReportRow key={session.id} session={session} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyReportState message="Bu dönemde tamamlanmış gün sonu kaydı bulunmuyor." />
        )}
      </ReportPanel>
    </div>
  )
}

function InventoryTab({ stats }: { stats: JewelerStats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PanelStatCard
          label="Toplam ürün"
          value={String(stats.inventory.total_products)}
          hint={`${stats.inventory.total_stock_units} adet stok`}
          accent="brand"
        />
        <PanelStatCard
          label="Toplam gram"
          value={`${stats.inventory.total_weight_gram.toLocaleString('tr-TR')} gr`}
          hint="Stoktaki toplam ağırlık"
          accent="amber"
        />
        <PanelStatCard
          label="Stok değeri"
          value={formatPanelMoney(stats.inventory.inventory_sale_value)}
          hint="Satış fiyatına göre"
          accent="emerald"
        />
        <PanelStatCard
          label="Düşük / tükenen"
          value={`${stats.inventory.low_stock_count} / ${stats.inventory.out_of_stock_count}`}
          hint="Kritik stok durumu"
          accent="violet"
        />
      </div>

      <StatsBarChart
        title="Ayar bazlı stok dağılımı"
        items={stats.karat_breakdown.map((row) => ({
          label: `${row.karat} ayar`,
          value: row.stock_units,
          hint: `${row.product_count} ürün · ${row.total_weight_gram} gr`,
        }))}
        colorClass="bg-amber-600"
        accentHex="#d97706"
      />

      <ReportPanel
        title="Tüm ürünler"
        description={`${stats.all_products.length} aktif ürün kaydı`}
      >
        {stats.all_products.length === 0 ? (
          <EmptyReportState message="Henüz ürün kaydı yok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Ayar</th>
                  <th className="px-4 py-3 text-right">Gram</th>
                  <th className="px-4 py-3 text-right">Stok</th>
                  <th className="px-4 py-3 text-right">FIFO Maliyet</th>
                  <th className="px-4 py-3 text-right">Satış</th>
                  <th className="px-4 py-3 text-right">Stok Değeri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.all_products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3 text-slate-600">{product.category_name}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {product.karat ? `${product.karat} ayar` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{product.weight_gram} gr</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {product.stock_quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-brand-700">
                      {formatPanelMoney(product.fifo_unit_cost)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatPanelMoney(Number(product.sale_price))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-700">
                      {formatPanelMoney(product.stock_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportPanel>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}

function StockCountReportRow({ count }: { count: JewelryStockCountSummary }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3 text-slate-700">{formatDateTime(count.completed_at)}</td>
      <td className="px-4 py-3 text-right text-slate-700">{count.item_count}</td>
      <td className="px-4 py-3 text-right font-medium text-slate-900">{count.discrepancy_count}</td>
      <td className="px-4 py-3 text-right text-slate-700">{formatPanelMoney(count.expected_cash_balance)}</td>
      <td className="px-4 py-3 text-right text-slate-700">
        {count.counted_cash_balance !== null ? formatPanelMoney(count.counted_cash_balance) : '—'}
      </td>
      <td className="px-4 py-3">
        <DifferenceBadge value={count.cash_difference} />
      </td>
    </tr>
  )
}

function CashSessionReportRow({ session }: { session: JewelryCashSessionSummary }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3 text-slate-700">{formatDateTime(session.closed_at)}</td>
      <td className="px-4 py-3 text-right text-slate-700">{formatPanelMoney(session.opening_balance)}</td>
      <td className="px-4 py-3 text-right text-slate-700">
        {session.expected_balance !== null ? formatPanelMoney(session.expected_balance) : '—'}
      </td>
      <td className="px-4 py-3 text-right text-slate-700">
        {session.counted_balance !== null ? formatPanelMoney(session.counted_balance) : '—'}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-900">
        {session.cash_difference !== null ? formatPanelMoney(session.cash_difference) : '—'}
      </td>
      <td className="px-4 py-3 text-right text-slate-700">{formatPanelMoney(session.cash_sale_total)}</td>
      <td className="px-4 py-3 text-right text-slate-700">{session.transaction_count}</td>
    </tr>
  )
}
