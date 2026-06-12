import { useCallback, useEffect, useState } from 'react'
import { getJewelerStats, type JewelerStats } from '../../api/jeweler'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
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
      <PageHeader title="Raporlama" description="Satış, stok ve tamir performans özetleri" />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PanelStatCard label="Günlük ciro" value={formatPanelMoney(stats.summary.today_revenue)} accent="amber" />
            <PanelStatCard label="Aylık ciro" value={formatPanelMoney(stats.summary.month_revenue)} accent="brand" />
            <PanelStatCard label="Ortalama satış" value={formatPanelMoney(stats.summary.average_sale)} accent="emerald" />
            <PanelStatCard label="Aktif tamir" value={String(stats.repairs.active_count)} accent="violet" />
          </div>

          {stats.top_products.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-900">Ayın en çok satan ürünleri</h3>
              <ul className="mt-4 space-y-2">
                {stats.top_products.map((product) => (
                  <li key={product.product_name} className="flex justify-between text-sm">
                    <span className="font-medium text-slate-800">{product.product_name}</span>
                    <span className="text-slate-600">
                      {product.quantity} adet · {formatPanelMoney(product.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.payment_breakdown.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-900">Bugünkü ödeme dağılımı</h3>
              <ul className="mt-4 space-y-2">
                {stats.payment_breakdown.map((row) => (
                  <li key={row.payment_method} className="flex justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      {PAYMENT_LABELS[row.payment_method] ?? row.payment_method}
                    </span>
                    <span className="text-slate-600">
                      {row.count} işlem · {formatPanelMoney(row.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
