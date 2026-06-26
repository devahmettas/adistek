import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurantStats, type RestaurantStats } from '../../api/stats'
import LoadingState from '../../components/LoadingState'
import {
  ActiveFeaturesBadges,
  formatPanelMoney,
  PanelActionCard,
  PanelSetupCard,
  PanelStatCard,
} from '../../components/restaurant/ManagementPanelWidgets'
import {
  isRestaurantFeatureEnabled,
} from '../../constants/restaurantFeatures'
import { useAuth } from '../../store/AuthStore'

export default function ManagementPanelPage() {
  const { restaurant } = useAuth()
  const [stats, setStats] = useState<RestaurantStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState(false)

  const orderTracking = isRestaurantFeatureEnabled(restaurant, 'order_tracking')
  const qrMenu = isRestaurantFeatureEnabled(restaurant, 'qr_menu')
  const reservations = isRestaurantFeatureEnabled(restaurant, 'reservations')
  const menuCatalog = orderTracking || qrMenu

  const loadStats = useCallback(async () => {
    if (!orderTracking) {
      return
    }

    setStatsLoading(true)
    setStatsError(false)

    try {
      setStats(await getRestaurantStats())
    } catch {
      setStatsError(true)
    } finally {
      setStatsLoading(false)
    }
  }, [orderTracking])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const menuPath = restaurant?.slug
    ? `/menu/${restaurant.slug}`
    : restaurant?.id
      ? `/menu/${restaurant.id}`
      : null

  return (
    <div className="space-y-8">
      <section className="panel-hero">
        <div className="panel-hero__content">
          <p className="panel-hero__eyebrow">Yönetim Paneli</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            {restaurant?.name ?? 'İşletme'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Günlük operasyonlarınızı, menünüzü ve ayarlarınızı tek yerden yönetin.
          </p>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Aktif modüller
            </p>
            <ActiveFeaturesBadges restaurant={restaurant} />
          </div>
        </div>
      </section>

      {orderTracking && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-heading">Bugünün özeti</h2>
              <p className="section-caption">Canlı satış ve masa durumu</p>
            </div>
            <Link
              to="/dashboard/stats"
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Detaylı istatistikler →
            </Link>
          </div>

          {statsLoading && <LoadingState label="Özet yükleniyor..." />}

          {statsError && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              İstatistik özeti yüklenemedi. Daha sonra tekrar deneyin.
            </p>
          )}

          {!statsLoading && stats && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <PanelStatCard
                  label="Günlük ciro"
                  value={formatPanelMoney(stats.summary.revenue)}
                  hint={`${stats.summary.table_sessions} masa kapanışı`}
                  accent="brand"
                />
                <PanelStatCard
                  label="Aktif masa"
                  value={String(stats.live.active_tables)}
                  hint={`Toplam ${stats.live.total_tables} masa`}
                  accent="emerald"
                />
                <PanelStatCard
                  label="Satılan ürün"
                  value={String(stats.summary.items_sold)}
                  hint="Bugün tamamlanan kalemler"
                  accent="amber"
                />
                <PanelStatCard
                  label="Ortalama hesap"
                  value={formatPanelMoney(stats.summary.average_bill)}
                  hint={`Açık sipariş: ${formatPanelMoney(stats.live.open_revenue)}`}
                  accent="violet"
                />
              </div>

              {stats.top_products.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    En çok satan
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {stats.top_products[0].product_name}
                    <span className="ml-2 text-sm font-semibold text-brand-700">
                      {stats.top_products[0].quantity} adet
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="section-heading">Günlük işlemler</h2>
          <p className="section-caption">Sık kullanılan ekranlara hızlı geçiş</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orderTracking && (
            <PanelActionCard
              to="/dashboard/masalar"
              title="Masalar"
              description="Açık masaları görün, sipariş alın ve hesap kapatın."
              icon="◫"
              badge="Canlı"
            />
          )}
          {orderTracking && (
            <PanelActionCard
              to="/dashboard/stats"
              title="İstatistikler"
              description="Ciro, garson performansı ve masa yoğunluğu analizleri."
              icon="▤"
            />
          )}
          {reservations && (
            <PanelActionCard
              to="/dashboard/reservations"
              title="Rezervasyonlar"
              description="Günlük rezervasyonları planlayın ve düzenleyin."
              icon="◷"
            />
          )}
          {menuCatalog && (
            <>
              <PanelActionCard
                to="/dashboard/categories"
                title="Kategoriler"
                description="Menü kategorilerini oluşturun ve düzenleyin."
                icon="▦"
              />
              <PanelActionCard
                to="/dashboard/products"
                title="Ürünler"
                description="Ürün, fiyat, görsel ve alerjen bilgilerini yönetin."
                icon="▣"
              />
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-heading">Kurulum ve ayarlar</h2>
          <p className="section-caption">
            Personel, masa ve müşteri menüsü yapılandırmasını buradan yönetin
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {orderTracking && (
            <PanelSetupCard
              to="/dashboard/staff"
              title="Personel"
              description="Garson ve mutfak ekibinin giriş hesaplarını yönetin."
              icon="◉"
              items={['Garson ekle / düzenle', 'Mutfak personeli tanımla', 'Aktiflik durumu']}
            />
          )}
          {orderTracking && (
            <PanelSetupCard
              to="/dashboard/tables"
              title="Masa Ayarları"
              description="Masalarınızı oluşturun, QR kodlarını yönetin."
              icon="⬚"
              items={['Masa ekle ve adlandır', 'QR kodları görüntüle', 'Masa sil / düzenle']}
            />
          )}
          {qrMenu && (
            <PanelSetupCard
              to="/dashboard/menu"
              title="Müşteri Menüsü"
              description="QR menü görünümü, slaytlar ve paylaşım linki."
              icon="◎"
              items={[
                'Menü linki ve önizleme',
                'Üst slayt alanı',
                'Menü metinleri ve slogan',
              ]}
            />
          )}
        </div>

        {qrMenu && menuPath && (
          <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Müşteri menü linki:
              <a
                href={menuPath}
                target="_blank"
                rel="noreferrer"
                className="ml-2 font-semibold text-brand-700 hover:underline"
              >
                {window.location.origin}
                {menuPath}
              </a>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
