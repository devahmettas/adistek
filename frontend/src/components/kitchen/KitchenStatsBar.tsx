interface KitchenStatsBarProps {
  pendingCount: number
  readyCount: number
  cancelledCount: number
  tableCount: number
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'brand' | 'amber' | 'emerald' | 'red' | 'slate'
}) {
  const tones = {
    brand: 'border-brand-200 bg-brand-50',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    red: 'border-red-200 bg-red-50',
    slate: 'border-slate-200 bg-white',
  }

  const valueColors = {
    brand: 'text-brand-800',
    amber: 'text-amber-800',
    emerald: 'text-emerald-800',
    red: 'text-red-700',
    slate: 'text-slate-800',
  }

  const labelColors = {
    brand: 'text-brand-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    red: 'text-red-600',
    slate: 'text-slate-500',
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-card ${tones[tone]}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${labelColors[tone]}`}>{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColors[tone]}`}>{value}</p>
    </div>
  )
}

export default function KitchenStatsBar({
  pendingCount,
  readyCount,
  cancelledCount,
  tableCount,
}: KitchenStatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Bekleyen ürün" value={pendingCount} tone="amber" />
      <StatCard label="Hazır ürün" value={readyCount} tone="emerald" />
      <StatCard label="Aktif masa" value={tableCount} tone="brand" />
      <StatCard label="İptal bildirimi" value={cancelledCount} tone={cancelledCount > 0 ? 'red' : 'slate'} />
    </div>
  )
}
