import type { StatsHourlyRow } from '../api/stats'

interface HourlyLineChartProps {
  items: StatsHourlyRow[]
  formatMoney: (value: number) => string
}

interface HourlyPoint {
  hour: number
  label: string
  revenue: number
  sessions: number
}

function buildFullDaySeries(items: StatsHourlyRow[]): HourlyPoint[] {
  const map = new Map(items.map((row) => [row.hour, row]))

  return Array.from({ length: 24 }, (_, hour) => {
    const row = map.get(hour)

    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      revenue: row?.revenue ?? 0,
      sessions: row?.sessions ?? 0,
    }
  })
}

export default function HourlyLineChart({ items, formatMoney }: HourlyLineChartProps) {
  const series = buildFullDaySeries(items)
  const hasRevenue = series.some((point) => point.revenue > 0)

  if (!hasRevenue) {
    return <p className="text-sm text-gray-500">Bu gün için saatlik veri yok.</p>
  }

  const width = 800
  const height = 260
  const padding = { top: 20, right: 24, bottom: 36, left: 56 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxRevenue = Math.max(...series.map((point) => point.revenue), 1)

  const points = series.map((point, index) => {
    const x = padding.left + (index / 23) * plotWidth
    const y = padding.top + (1 - point.revenue / maxRevenue) * plotHeight

    return { ...point, x, y }
  })

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    value: maxRevenue * ratio,
    y: padding.top + (1 - ratio) * plotHeight,
  }))

  const xLabelHours = [0, 3, 6, 9, 12, 15, 18, 21, 23]

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-full"
          role="img"
          aria-label="Saatlik ciro çizgi grafiği"
        >
          <defs>
            <linearGradient id="hourlyAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.ratio}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#e5e7eb"
                strokeDasharray={tick.ratio === 0 ? undefined : '4 4'}
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-gray-400 text-[11px]"
              >
                {Math.round(tick.value).toLocaleString('tr-TR')} ₺
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#hourlyAreaGradient)" />
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points
            .filter((point) => point.revenue > 0)
            .map((point) => (
              <g key={point.hour}>
                <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2">
                  <title>
                    {point.label}: {formatMoney(point.revenue)} ({point.sessions} masa)
                  </title>
                </circle>
              </g>
            ))}

          {xLabelHours.map((hour) => {
            const x = padding.left + (hour / 23) * plotWidth

            return (
              <text
                key={hour}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="fill-gray-500 text-[11px]"
              >
                {String(hour).padStart(2, '0')}:00
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {series
          .filter((point) => point.revenue > 0)
          .map((point) => (
            <span
              key={point.hour}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800"
            >
              {point.label}: {formatMoney(point.revenue)}
            </span>
          ))}
      </div>
    </div>
  )
}
