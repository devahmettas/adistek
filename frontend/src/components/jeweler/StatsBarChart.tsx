interface StatsBarChartItem {
  label: string
  value: number
  hint?: string
}

interface StatsBarChartProps {
  title: string
  items: StatsBarChartItem[]
  valueFormatter?: (value: number) => string
  colorClass?: string
}

export default function StatsBarChart({
  title,
  items,
  valueFormatter = (value) => value.toLocaleString('tr-TR'),
  colorClass = 'bg-amber-500',
}: StatsBarChartProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-4 text-sm text-slate-500">Henüz veri yok.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{item.label}</span>
              <span className="shrink-0 font-semibold text-slate-900">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${colorClass} transition-all`}
                style={{ width: `${Math.max((item.value / maxValue) * 100, 4)}%` }}
              />
            </div>
            {item.hint && <p className="mt-1 text-xs text-slate-500">{item.hint}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
