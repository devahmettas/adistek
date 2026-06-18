import { useCallback, useEffect, useState } from 'react'
import {
  getJewelerStats,
  getJewelrySettings,
  type JewelerStats,
  type JewelerStatsPeriod,
} from '../../api/jeweler'
import Button from '../../components/Button'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import StatsBarChart from '../../components/jeweler/StatsBarChart'
import StatsTrendChart from '../../components/jeweler/StatsTrendChart'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'
import { useAuth } from '../../store/AuthStore'
import { downloadJewelerReportPdf } from '../../utils/jewelerReportPdf'

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

function trendTitle(period: JewelerStatsPeriod): string {
  if (period === 'day') return 'Bugünkü saatlik satış trendi'
  if (period === 'week') return 'Son 7 gün satış trendi'
  return 'Son 30 gün satış trendi'
}

export default function JewelerReportsPage() {
  const { restaurant } = useAuth()
  const [period, setPeriod] = useState<JewelerStatsPeriod>('month')
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raporlama & İstatistikler"
        description="Satış, stok, tamir ve müşteri performansını dönem bazında takip edin"
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`min-h-10 flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                    period === option.value
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={!stats || loading || downloading}
              onClick={() => void handleDownloadPdf()}
            >
              {downloading ? 'PDF hazırlanıyor…' : 'PDF İndir'}
            </Button>
          </div>
        }
      />

      {stats && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-brand-700">{stats.period_label}</span> rapor ·{' '}
          {stats.date_range.start === stats.date_range.end
            ? new Date(`${stats.date_range.start}T00:00:00`).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : `${new Date(`${stats.date_range.start}T00:00:00`).toLocaleDateString('tr-TR')} – ${new Date(`${stats.date_range.end}T00:00:00`).toLocaleDateString('tr-TR')}`}
        </p>
      )}

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {stats && periodSummary && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">{stats.period_label} Satış Özeti</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PanelStatCard
                label="Ciro"
                value={formatPanelMoney(periodSummary.revenue)}
                hint={`${periodSummary.sales_count} satış · Ort. ${formatPanelMoney(periodSummary.average_sale)}`}
                accent="amber"
              />
              <PanelStatCard
                label="Net kar"
                value={formatPanelMoney(periodSummary.profit)}
                hint={`Maliyet ${formatPanelMoney(periodSummary.cost)} · Marj %${periodSummary.profit_margin}`}
                accent="emerald"
              />
              <PanelStatCard
                label="Müşteri kayıtlı satış"
                value={String(periodSummary.sales_with_customer)}
                hint={`Toplam ${stats.customers.total_count} müşteri`}
                accent="violet"
              />
              <PanelStatCard
                label="Stok değeri"
                value={formatPanelMoney(stats.inventory.inventory_sale_value)}
                hint={`${stats.inventory.total_stock_units} adet stok`}
                accent="brand"
              />
            </div>
          </section>

          <StatsTrendChart title={trendTitle(stats.period)} points={stats.revenue_trend} />

          <section className="grid gap-4 xl:grid-cols-2">
            <StatsBarChart
              title={`${stats.period_label} en çok satan ürünler`}
              items={stats.top_products.map((product) => ({
                label: product.product_name,
                value: product.revenue,
                hint: `${product.quantity} adet satıldı`,
              }))}
              valueFormatter={formatPanelMoney}
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
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <StatsBarChart
              title={`${stats.period_label} ödeme dağılımı`}
              items={stats.payment_breakdown.map((row) => ({
                label: PAYMENT_LABELS[row.payment_method] ?? row.payment_method,
                value: row.total,
                hint: `${row.count} işlem`,
              }))}
              valueFormatter={formatPanelMoney}
              colorClass="bg-emerald-500"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-900">Karlılık detayı</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Ciro', value: formatPanelMoney(periodSummary.revenue) },
                  { label: 'Maliyet', value: formatPanelMoney(periodSummary.cost) },
                  { label: 'Net kar', value: formatPanelMoney(periodSummary.profit) },
                  { label: 'Kar marjı', value: `%${periodSummary.profit_margin}` },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                Kar hesabı her satışta FIFO alış maliyetine göre yapılır. Aynı ürün farklı fiyatlardan
                alındıysa sırayla en eski lot kullanılır.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Stok & Envanter</h2>
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
                hint="Düşük stok · Tükenen"
                accent="violet"
              />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <StatsBarChart
              title="Ayar bazlı stok dağılımı"
              items={stats.karat_breakdown.map((row) => ({
                label: `${row.karat} ayar`,
                value: row.stock_units,
                hint: `${row.product_count} ürün · ${row.total_weight_gram} gr`,
              }))}
              colorClass="bg-amber-600"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-900">Tamir durumu</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Aktif tamir', value: stats.repairs.active_count },
                  { label: 'Teslim alındı', value: stats.repairs.received_count },
                  { label: 'İşlemde', value: stats.repairs.in_progress_count },
                  { label: 'Tamamlandı', value: stats.repairs.completed_count },
                  { label: 'Teslim edildi', value: stats.repairs.delivered_count },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Tüm Ürünler</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              {stats.all_products.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Henüz ürün kaydı yok.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Ürün</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right">Ayar</th>
                        <th className="px-4 py-3 text-right">Gram</th>
                        <th className="px-4 py-3 text-right">Stok</th>
                        <th className="px-4 py-3 text-right">Ort. Alış</th>
                        <th className="px-4 py-3 text-right">Altın Değeri</th>
                        <th className="px-4 py-3 text-right">Ort. Maliyet</th>
                        <th className="px-4 py-3 text-right">FIFO Maliyet</th>
                        <th className="px-4 py-3 text-right">Satış</th>
                        <th className="px-4 py-3 text-right">Stok Değeri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.all_products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                          <td className="px-4 py-3 text-slate-600">{product.category_name}</td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {product.karat ? `${product.karat} ayar` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">{product.weight_gram} gr</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {product.stock_quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatPanelMoney(product.average_unit_cost)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-700">
                            {formatPanelMoney(product.metal_value)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatPanelMoney(product.unit_cost)}
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
            </div>
          </section>
        </>
      )}
    </div>
  )
}
