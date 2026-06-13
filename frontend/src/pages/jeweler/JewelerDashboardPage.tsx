import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJewelerStats, type JewelerStats } from '../../api/jeweler'
import LoadingState from '../../components/LoadingState'
import { formatPanelMoney, PanelActionCard, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'
import { useAuth } from '../../store/AuthStore'

export default function JewelerDashboardPage() {
  const { restaurant } = useAuth()
  const [stats, setStats] = useState<JewelerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setStats(await getJewelerStats())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 px-6 py-8 text-white shadow-panel lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Kuyumcu Paneli</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{restaurant?.name ?? 'İşletme'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-amber-100">
          Stok, satış, tamir ve müşteri yönetimini tek panelden takip edin.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bugünün özeti</h2>
            <p className="text-sm text-slate-600">Günlük satış ve stok durumu</p>
          </div>
          <Link
            to="/dashboard/jeweler/reports"
            className="text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            Detaylı raporlar →
          </Link>
        </div>

        {loading && <LoadingState label="Özet yükleniyor..." />}
        {error && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            İstatistik özeti yüklenemedi.
          </p>
        )}

        {!loading && stats && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PanelStatCard
              label="Günlük ciro"
              value={formatPanelMoney(stats.summary.today_revenue)}
              hint={`${stats.summary.today_sales_count} satış`}
              accent="amber"
            />
            <PanelStatCard
              label="Aylık ciro"
              value={formatPanelMoney(stats.summary.month_revenue)}
              hint={`${stats.summary.month_sales_count} satış`}
              accent="brand"
            />
            <PanelStatCard
              label="Haftalık ciro"
              value={formatPanelMoney(stats.summary.week_revenue)}
              hint={`${stats.summary.week_sales_count} satış`}
              accent="emerald"
            />
            <PanelStatCard
              label="Aktif tamir"
              value={String(stats.repairs.active_count)}
              hint="Devam eden işler"
              accent="violet"
            />
            <PanelStatCard
              label="Düşük stok"
              value={String(stats.inventory.low_stock_count)}
              hint={`${stats.inventory.out_of_stock_count} tükenen ürün`}
              accent="amber"
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Modüller</h2>
          <p className="text-sm text-slate-600">Kuyumcu yönetim ekranlarına hızlı erişim</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PanelActionCard to="/dashboard/jeweler/products" title="Ürün Yönetimi" description="Altın, gümüş ve mücevher ürünlerini tanımlayın." icon="◆" />
          <PanelActionCard to="/dashboard/jeweler/stock" title="Stok Yönetimi" description="Stok giriş/çıkış hareketlerini izleyin." icon="▤" />
          <PanelActionCard to="/dashboard/jeweler/sales" title="Satış Yönetimi" description="Satış kayıtlarını görüntüleyin ve oluşturun." icon="₺" />
          <PanelActionCard to="/dashboard/jeweler/repairs" title="Tamir Takibi" description="Müşteri tamir işlerini takip edin." icon="⚙" />
          <PanelActionCard to="/dashboard/jeweler/customers" title="Müşteri Yönetimi" description="Müşteri kartlarını yönetin." icon="◉" />
          <PanelActionCard to="/dashboard/jeweler/barcode" title="Barkod Sistemi" description="Barkod ile ürün sorgulayın." icon="▥" />
          <PanelActionCard to="/dashboard/jeweler/gold-prices" title="Altın Fiyatları" description="Güncel altın alış/satış fiyatlarını kaydedin." icon="★" />
          <PanelActionCard to="/dashboard/jeweler/reports" title="Raporlama" description="Satış ve performans raporları." icon="▦" />
          <PanelActionCard to="/dashboard/jeweler/settings" title="Ayarlar" description="Kuyumcu panel ayarlarını yapılandırın." icon="⚙" />
        </div>
      </section>
    </div>
  )
}
