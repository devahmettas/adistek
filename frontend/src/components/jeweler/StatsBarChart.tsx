import { useState } from 'react'

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
  accentHex?: string
}

export default function StatsBarChart({
  title,
  items,
  valueFormatter = (value) => value.toLocaleString('tr-TR'),
  colorClass = 'bg-amber-500',
  accentHex = '#f59e0b',
}: StatsBarChartProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <p className="px-5 py-8 text-center text-sm text-slate-500">Henüz veri yok.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{items.length} kayıt</p>
      </div>

      <ul className="space-y-1 p-4">
        {items.map((item, index) => {
          const isActive = activeLabel === item.label
          const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 6 : 0)

          return (
            <li key={`${item.label}-${index}`}>
              <button
                type="button"
                className={`w-full rounded-xl px-3 py-3 text-left transition ${
                  isActive ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-slate-50/80'
                }`}
                onMouseEnter={() => setActiveLabel(item.label)}
                onMouseLeave={() => setActiveLabel(null)}
                onFocus={() => setActiveLabel(item.label)}
                onBlur={() => setActiveLabel(null)}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
                    )}
                  </div>
                  <span
                    className="shrink-0 text-sm font-bold"
                    style={{ color: isActive ? accentHex : '#0f172a' }}
                  >
                    {valueFormatter(item.value)}
                  </span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${colorClass} transition-all duration-300`}
                    style={{
                      width: `${width}%`,
                      opacity: isActive ? 1 : 0.82,
                    }}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
