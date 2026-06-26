import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJewelerDashboardOverview, type JewelerDashboardOverview } from '../../api/jeweler'
import JewelerDashboardOverviewPanel from '../../components/jeweler/JewelerDashboardOverviewPanel'
import LoadingState from '../../components/LoadingState'
import { PanelActionCard } from '../../components/restaurant/ManagementPanelWidgets'
import { useJewelerFeatures } from '../../hooks/useJewelerFeatures'
import { useJewelerPermissions } from '../../hooks/useJewelerPermissions'
import { useAuth } from '../../store/AuthStore'

export default function JewelerDashboardPage() {
  const { restaurant, isOwner } = useAuth()
  const { barcodeEnabled, reportsEnabled } = useJewelerFeatures()
  const { can, canViewProfits, canViewVault } = useJewelerPermissions()
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
      <section className="panel-hero panel-hero--amber">
        <div className="panel-hero__content">
          <p className="panel-hero__eyebrow">Kuyumcu Paneli</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            {restaurant?.name ?? 'İşletme'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Stok, satış ve müşteri yönetimini tek panelden takip edin. Günlük, haftalık ve aylık performansınızı anlık görün.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-heading">Bugünün özeti</h2>
            <p className="section-caption">
              Günlük, haftalık ve aylık ciro · kar · stok ve satış analizi
            </p>
          </div>
          {reportsEnabled && can('view_reports') && (
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>İstatistik özeti yüklenemedi.</p>
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="mt-2 font-semibold text-amber-800 underline hover:text-amber-900"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {!loading && overview && (
          <JewelerDashboardOverviewPanel
            overview={overview}
            reportsEnabled={reportsEnabled}
            canViewProfits={canViewProfits}
            canViewVault={canViewVault}
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-heading">Modüller</h2>
          <p className="section-caption">Kuyumcu yönetim ekranlarına hızlı erişim</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {can('manage_products') && (
            <PanelActionCard to="/dashboard/jeweler/products" title="Ürün Yönetimi" description="Altın, gümüş ve mücevher ürünlerini tanımlayın." icon="◆" />
          )}
          {can('manage_purchases') && (
            <PanelActionCard to="/dashboard/jeweler/purchases" title="Ürün Alış Satış" description="Müşteriden alım ve müşteriye satış işlemlerini tek ekrandan yönetin." icon="⇅" />
          )}
          {can('manage_sales') && (
            <PanelActionCard to="/dashboard/jeweler/history" title="İşlem Geçmişi" description="Geçmiş satış ve alım kayıtlarını inceleyin." icon="☰" />
          )}
          {canViewVault && (
            <PanelActionCard to="/dashboard/jeweler/vault" title="Kasa Yönetimi" description="Stok değeri, nakit bakiye ve kategori bazlı kasa takibi." icon="▤" />
          )}
          {can('manage_stock_count') && (
            <PanelActionCard to="/dashboard/jeweler/stock-count" title="Stok Takip" description="Elle sayım ile stok ve nakit açıklarını tespit edin." icon="▧" />
          )}
          {can('manage_customers') && (
            <PanelActionCard to="/dashboard/jeweler/customers" title="Müşteri Yönetimi" description="Müşteri kartlarını yönetin." icon="◉" />
          )}
          {can('manage_products') && (
            <PanelActionCard
              to="/dashboard/jeweler/barcode"
              title="Barkod Sistemi"
              description="Ürün okutun, sorgulayın ve takı şerit etiketi yazdırın."
              icon="▥"
              locked={!barcodeEnabled}
            />
          )}
          <PanelActionCard to="/dashboard/jeweler/gold-prices" title="Altın Fiyatları" description="Güncel altın alış/satış fiyatlarını kaydedin." icon="★" />
          {can('view_reports') && (
            <PanelActionCard
              to="/dashboard/jeweler/reports"
              title="Raporlama"
              description="Satış ve performans raporları."
              icon="▦"
              locked={!reportsEnabled}
            />
          )}
          {isOwner && (
            <PanelActionCard to="/dashboard/jeweler/profile" title="Profil" description="Plan, ayarlar ve personel yönetimi." icon="⚙" />
          )}
        </div>
      </section>
    </div>
  )
}
