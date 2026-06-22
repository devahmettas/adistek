import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJewelerDashboardOverview, type JewelerDashboardOverview } from '../../api/jeweler'
import JewelerDashboardOverviewPanel from '../../components/jeweler/JewelerDashboardOverviewPanel'
import LoadingState from '../../components/LoadingState'
import { PanelActionCard } from '../../components/restaurant/ManagementPanelWidgets'
import { useJewelerFeatures } from '../../hooks/useJewelerFeatures'
import { useAuth } from '../../store/AuthStore'

export default function JewelerDashboardPage() {
  const { restaurant } = useAuth()
  const { barcodeEnabled, reportsEnabled } = useJewelerFeatures()
  const [overview, setOverview] = useState<JewelerDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setOverview(await getJewelerDashboardOverview())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 px-6 py-8 text-white shadow-panel lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Kuyumcu Paneli</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{restaurant?.name ?? 'İşletme'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-amber-100">
          Stok, satış ve müşteri yönetimini tek panelden takip edin. Günlük, haftalık ve aylık performansınızı anlık görün.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bugünün özeti</h2>
            <p className="text-sm text-slate-600">
              Günlük, haftalık ve aylık ciro · kar · stok ve satış analizi
            </p>
          </div>
          {reportsEnabled && (
            <Link
              to="/dashboard/jeweler/reports"
              className="text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Detaylı raporlar →
            </Link>
          )}
        </div>

        {loading && <LoadingState label="Özet yükleniyor..." />}
        {error && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            İstatistik özeti yüklenemedi.
          </p>
        )}

        {!loading && overview && (
          <JewelerDashboardOverviewPanel overview={overview} reportsEnabled={reportsEnabled} />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Modüller</h2>
          <p className="text-sm text-slate-600">Kuyumcu yönetim ekranlarına hızlı erişim</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PanelActionCard to="/dashboard/jeweler/products" title="Ürün Yönetimi" description="Altın, gümüş ve mücevher ürünlerini tanımlayın." icon="◆" />
          <PanelActionCard to="/dashboard/jeweler/purchases" title="Ürün Alış Satış" description="Müşteriden alım ve müşteriye satış işlemlerini tek ekrandan yönetin." icon="⇅" />
          <PanelActionCard to="/dashboard/jeweler/history" title="İşlem Geçmişi" description="Geçmiş satış ve alım kayıtlarını inceleyin." icon="☰" />
          <PanelActionCard to="/dashboard/jeweler/vault" title="Kasa Yönetimi" description="Stok değeri, nakit bakiye ve kategori bazlı kasa takibi." icon="▤" />
          <PanelActionCard to="/dashboard/jeweler/stock-count" title="Stok Takip" description="Elle sayım ile stok ve nakit açıklarını tespit edin." icon="▧" />
          <PanelActionCard to="/dashboard/jeweler/customers" title="Müşteri Yönetimi" description="Müşteri kartlarını yönetin." icon="◉" />
          <PanelActionCard
            to="/dashboard/jeweler/barcode"
            title="Barkod Sistemi"
            description="Ürün okutun, sorgulayın ve takı şerit etiketi yazdırın."
            icon="▥"
            locked={!barcodeEnabled}
          />
          <PanelActionCard to="/dashboard/jeweler/gold-prices" title="Altın Fiyatları" description="Güncel altın alış/satış fiyatlarını kaydedin." icon="★" />
          <PanelActionCard
            to="/dashboard/jeweler/reports"
            title="Raporlama"
            description="Satış ve performans raporları."
            icon="▦"
            locked={!reportsEnabled}
          />
          <PanelActionCard to="/dashboard/jeweler/settings" title="Ayarlar" description="Kuyumcu panel ayarlarını yapılandırın." icon="⚙" />
        </div>
      </section>
    </div>
  )
}
