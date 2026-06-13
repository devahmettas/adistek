import { useCallback, useEffect, useState } from 'react'
import { getJewelerStats, type JewelerStats } from '../../api/jeweler'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import StatsBarChart from '../../components/jeweler/StatsBarChart'
import StatsTrendChart from '../../components/jeweler/StatsTrendChart'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale/EFT',
  gold_exchange: 'Altın Takas',
}

export default function JewelerReportsPage() {
  const [stats, setStats] = useState<JewelerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await getJewelerStats())
    } catch {
      setError('Raporlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raporlama & İstatistikler"
        description="Satış, stok, tamir ve müşteri performansını tek ekranda takip edin"
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {stats && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Satış Özeti</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PanelStatCard
                label="Bugünkü ciro"
                value={formatPanelMoney(stats.summary.today_revenue)}
                hint={`${stats.summary.today_sales_count} satış · Ort. ${formatPanelMoney(stats.summary.average_sale)}`}
                accent="amber"
              />
              <PanelStatCard
                label="Haftalık ciro"
                value={formatPanelMoney(stats.summary.week_revenue)}
                hint={`${stats.summary.week_sales_count} satış`}
                accent="brand"
              />
              <PanelStatCard
                label="Aylık ciro"
                value={formatPanelMoney(stats.summary.month_revenue)}
                hint={`${stats.summary.month_sales_count} satış · Ort. ${formatPanelMoney(stats.summary.month_average_sale)}`}
                accent="emerald"
              />
              <PanelStatCard
                label="Müşteri kayıtlı satış"
                value={String(stats.customers.month_sales_with_customer)}
                hint={`Toplam ${stats.customers.total_count} müşteri`}
                accent="violet"
              />
            </div>
          </section>

          <StatsTrendChart title="Son 7 gün satış trendi" points={stats.revenue_trend} />

          <section className="grid gap-4 xl:grid-cols-2">
            <StatsBarChart
              title="Ayın en çok satan ürünleri"
              items={stats.top_products.map((product) => ({
                label: product.product_name,
                value: product.revenue,
                hint: `${product.quantity} adet satıldı`,
              }))}
              valueFormatter={formatPanelMoney}
            />
            <StatsBarChart
              title="Kategori bazlı aylık satış"
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
              title="Bugünkü ödeme dağılımı"
              items={stats.payment_breakdown.map((row) => ({
                label: PAYMENT_LABELS[row.payment_method] ?? row.payment_method,
                value: row.total,
                hint: `${row.count} işlem`,
              }))}
              valueFormatter={formatPanelMoney}
              colorClass="bg-emerald-500"
            />
            <StatsBarChart
              title="Aylık ödeme dağılımı"
              items={stats.month_payment_breakdown.map((row) => ({
                label: PAYMENT_LABELS[row.payment_method] ?? row.payment_method,
                value: row.total,
                hint: `${row.count} işlem`,
              }))}
              valueFormatter={formatPanelMoney}
              colorClass="bg-violet-500"
            />
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
        </>
      )}
    </div>
  )
}
