interface ChartPoint {
  fetched_at: string
  cash_sell_price: number
  card_sell_price: number | null
}

interface GoldPriceChartProps {
  points: ChartPoint[]
  height?: number
}

export default function GoldPriceChart({ points, height = 220 }: GoldPriceChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
        Grafik için yeterli veri yok.
      </div>
    )
  }

  const values = points.map((point) => point.cash_sell_price)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 640
  const padding = 24

  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - ((point.cash_sell_price - min) / range) * (height - padding * 2)

    return { x, y, point }
  })

  const linePath = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? padding} ${height - padding} L ${coords[0]?.x ?? padding} ${height - padding} Z`

  const first = points[0]
  const last = points[points.length - 1]
  const change = last.cash_sell_price - first.cash_sell_price
  const changePercent = first.cash_sell_price > 0 ? (change / first.cash_sell_price) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nakit satış grafiği</p>
          <p className="text-2xl font-bold text-slate-900">
            {last.cash_sell_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </p>
        </div>
        <p className={`text-sm font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}
          {change.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ({changePercent.toFixed(2)}%)
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="goldChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padding - ratio * (height - padding * 2)
            const value = min + ratio * range

            return (
              <g key={ratio}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={4} y={y + 4} fill="#94a3b8" fontSize="10">
                  {value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </text>
              </g>
            )
          })}
          <path d={areaPath} fill="url(#goldChartFill)" />
          <path d={linePath} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((coord) => (
            <circle key={coord.point.fetched_at} cx={coord.x} cy={coord.y} r="3" fill="#b45309" />
          ))}
        </svg>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{new Date(first.fetched_at).toLocaleString('tr-TR')}</span>
        <span>{new Date(last.fetched_at).toLocaleString('tr-TR')}</span>
      </div>
    </div>
  )
}
