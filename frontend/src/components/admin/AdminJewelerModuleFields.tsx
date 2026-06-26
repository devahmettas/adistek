import type { JewelerFeatureKey } from '../../constants/jewelerFeatures'

export interface JewelerModuleSelection {
  feature_jeweler_barcode: boolean
  feature_jeweler_reports: boolean
}

interface ModuleItem {
  key: JewelerFeatureKey
  field: keyof JewelerModuleSelection
  title: string
  description: string
}

const MODULE_ITEMS: ModuleItem[] = [
  {
    key: 'barcode',
    field: 'feature_jeweler_barcode',
    title: 'Barkod Sistemi',
    description: 'Barkod okuma, ürün sorgulama ve barkod ile stok işlemleri.',
  },
  {
    key: 'reports',
    field: 'feature_jeweler_reports',
    title: 'Raporlama',
    description: 'Satış, stok ve işletme performans raporları.',
  },
]

interface AdminJewelerModuleFieldsProps {
  value: JewelerModuleSelection
  onChange: (value: JewelerModuleSelection) => void
}

export default function AdminJewelerModuleFields({
  value,
  onChange,
}: AdminJewelerModuleFieldsProps) {
  const toggle = (field: keyof JewelerModuleSelection) => {
    onChange({
      ...value,
      [field]: !value[field],
    })
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">Modül Seçimi</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          İşletme kaydı sırasında hangi modüllerin açık olacağını belirleyin.
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {MODULE_ITEMS.map((item) => {
          const enabled = value[item.field]

          return (
            <li key={item.key} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => toggle(item.field)}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                  enabled ? 'bg-brand-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
                <span className="sr-only">{enabled ? 'Aktif' : 'Pasif'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
