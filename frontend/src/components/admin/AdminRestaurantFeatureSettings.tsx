import type { RestaurantListItem } from '../../api/types'

interface AdminRestaurantFeatureSettingsProps {
  restaurant: RestaurantListItem
  onUpdate: (payload: {
    feature_order_tracking: boolean
    feature_qr_menu: boolean
    feature_reservations: boolean
  }) => Promise<void>
}

export default function AdminRestaurantFeatureSettings({
  restaurant,
  onUpdate,
}: AdminRestaurantFeatureSettingsProps) {
  const toggle = async (key: keyof Pick<
    RestaurantListItem,
    'feature_order_tracking' | 'feature_qr_menu' | 'feature_reservations'
  >) => {
    await onUpdate({
      feature_order_tracking:
        key === 'feature_order_tracking'
          ? !(restaurant.feature_order_tracking ?? true)
          : (restaurant.feature_order_tracking ?? true),
      feature_qr_menu:
        key === 'feature_qr_menu'
          ? !(restaurant.feature_qr_menu ?? true)
          : (restaurant.feature_qr_menu ?? true),
      feature_reservations:
        key === 'feature_reservations'
          ? !(restaurant.feature_reservations ?? true)
          : (restaurant.feature_reservations ?? true),
    })
  }

  const items = [
    {
      key: 'feature_order_tracking' as const,
      title: 'Masa & Sipariş Takibi',
      description: 'Masalar, mutfak, garson, istatistikler, satışlar, personel.',
      enabled: restaurant.feature_order_tracking ?? true,
    },
    {
      key: 'feature_qr_menu' as const,
      title: 'QR Menü Tasarımı',
      description: 'Müşteri menüsü, slaytlar, kategori ve ürün görselleri.',
      enabled: restaurant.feature_qr_menu ?? true,
    },
    {
      key: 'feature_reservations' as const,
      title: 'Rezervasyon',
      description: 'Masa rezervasyonları ve rezervasyon ayarları.',
      enabled: restaurant.feature_reservations ?? true,
    },
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">Özellik Ayarları</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pasif özellikler işletme panelinde görünmez ve kullanılamaz.
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.key} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={item.enabled}
              onClick={() => void toggle(item.key)}
              className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                item.enabled ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  item.enabled ? 'left-5' : 'left-0.5'
                }`}
              />
              <span className="sr-only">{item.enabled ? 'Aktif' : 'Pasif'}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
