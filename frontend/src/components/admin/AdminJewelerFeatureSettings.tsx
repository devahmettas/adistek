import type { RestaurantListItem } from '../../api/types'

interface AdminJewelerFeatureSettingsProps {
  restaurant: RestaurantListItem
  onUpdate: (payload: {
    feature_jeweler_barcode: boolean
    feature_jeweler_reports: boolean
  }) => Promise<void>
}

export default function AdminJewelerFeatureSettings({
  restaurant,
  onUpdate,
}: AdminJewelerFeatureSettingsProps) {
  const toggle = async (
    key: keyof Pick<RestaurantListItem, 'feature_jeweler_barcode' | 'feature_jeweler_reports'>,
  ) => {
    await onUpdate({
      feature_jeweler_barcode:
        key === 'feature_jeweler_barcode'
          ? !(restaurant.feature_jeweler_barcode ?? true)
          : (restaurant.feature_jeweler_barcode ?? true),
      feature_jeweler_reports:
        key === 'feature_jeweler_reports'
          ? !(restaurant.feature_jeweler_reports ?? true)
          : (restaurant.feature_jeweler_reports ?? true),
    })
  }

  const items = [
    {
      key: 'feature_jeweler_barcode' as const,
      title: 'Barkod Sistemi',
      description: 'Barkod okuma, ürün sorgulama ve barkod ile stok işlemleri.',
      enabled: restaurant.feature_jeweler_barcode ?? true,
    },
    {
      key: 'feature_jeweler_reports' as const,
      title: 'Raporlama',
      description: 'Satış, stok ve işletme performans raporları.',
      enabled: restaurant.feature_jeweler_reports ?? true,
    },
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">Kuyumcu Modül Ayarları</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pasif modüller işletme panelinde görünmez ve kullanılamaz.
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
