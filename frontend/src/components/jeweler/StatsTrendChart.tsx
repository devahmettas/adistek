interface StatsTrendPoint {
  label: string
  revenue: number
  sales_count: number
}

interface StatsTrendChartProps {
  title: string
  points: StatsTrendPoint[]
}

export default function StatsTrendChart({ title, points }: StatsTrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-4 text-sm text-slate-500">Henüz veri yok.</p>
      </div>
    )
  }

  const values = points.map((point) => point.revenue)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const height = 220
  const width = 640
  const padding = 28

  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - ((point.revenue - min) / range) * (height - padding * 2)

    return { x, y, point }
  })

  const linePath = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? padding} ${height - padding} L ${coords[0]?.x ?? padding} ${height - padding} Z`
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0)
  const totalSales = points.reduce((sum, point) => sum + point.sales_count, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {totalSales} satış · {totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" role="img" aria-label={title}>
          <defs>
            <linearGradient id="statsTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#statsTrendFill)" />
          <path d={linePath} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((coord) => (
            <circle key={coord.point.label} cx={coord.x} cy={coord.y} r="4" fill="#fff" stroke="#d97706" strokeWidth="2" />
          ))}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  )
}
