import type { JewelerFeatureKey } from '../../constants/jewelerFeatures'

const FEATURE_LABELS: Record<JewelerFeatureKey, string> = {
  barcode: 'Barkod Sistemi',
  reports: 'Raporlama',
}

interface JewelerFeatureDisabledNoticeProps {
  feature: JewelerFeatureKey
  compact?: boolean
}

export default function JewelerFeatureDisabledNotice({
  feature,
  compact = false,
}: JewelerFeatureDisabledNoticeProps) {
  const title = FEATURE_LABELS[feature]

  if (compact) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">{title} kapalı</p>
        <p className="mt-1 text-amber-800">
          Bu modül süper admin tarafından kapatılmıştır. Kullanmak için yöneticinizle iletişime geçin.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
        🔒
      </div>
      <p className="mt-4 text-lg font-semibold text-amber-900">{title} kapalı</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-amber-800">
        Bu modül işletmeniz için süper admin tarafından kapatılmıştır. Erişim için lütfen
        yöneticinizle iletişime geçin.
      </p>
    </div>
  )
}
