import { useCallback, useId, useMemo, useRef, useState } from 'react'

export interface StatsTrendPoint {
  date?: string
  label: string
  short_label?: string
  revenue: number
  sales_count: number
}

interface StatsTrendChartProps {
  title: string
  points: StatsTrendPoint[]
  valueFormatter?: (value: number) => string
}

const CHART = {
  width: 720,
  height: 280,
  padding: { top: 24, right: 20, bottom: 44, left: 56 },
}

function formatAxisMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₺`
  if (value >= 10_000) return `${(value / 1_000).toFixed(0)}K ₺`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ₺`
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`
}

function defaultMoneyFormatter(value: number): string {
  return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
}

function formatTooltipDate(point: StatsTrendPoint): string {
  if (point.date && !point.date.includes('T')) {
    return new Date(`${point.date}T12:00:00`).toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    })
  }
  if (point.date?.includes('T')) {
    return new Date(point.date).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return point.label
}

function getVisibleLabelIndices(count: number): number[] {
  if (count <= 1) return [0]
  if (count <= 8) return Array.from({ length: count }, (_, index) => index)

  const targetLabels = count > 20 ? 6 : 7
  const step = Math.max(1, Math.round((count - 1) / (targetLabels - 1)))
  const indices: number[] = []

  for (let index = 0; index < count; index += step) {
    indices.push(index)
  }

  if (indices[indices.length - 1] !== count - 1) {
    indices.push(count - 1)
  }

  return indices
}

function buildSmoothPath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return ''
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`

  let path = `M ${coords[0].x} ${coords[0].y}`

  for (let index = 0; index < coords.length - 1; index += 1) {
    const current = coords[index]
    const next = coords[index + 1]
    const controlX = (current.x + next.x) / 2
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
  }

  return path
}

export default function StatsTrendChart({
  title,
  points,
  valueFormatter = defaultMoneyFormatter,
}: StatsTrendChartProps) {
  const gradientId = useId()
  const chartRef = useRef<SVGSVGElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const chartMetrics = useMemo(() => {
    const plotWidth = CHART.width - CHART.padding.left - CHART.padding.right
    const plotHeight = CHART.height - CHART.padding.top - CHART.padding.bottom
    const revenues = points.map((point) => point.revenue)
    const rawMax = Math.max(...revenues, 0)
    const max = rawMax > 0 ? rawMax * 1.12 : 1
    const gridSteps = 4

    const coords = points.map((point, index) => {
      const x =
        CHART.padding.left +
        (index / Math.max(points.length - 1, 1)) * plotWidth
      const y =
        CHART.padding.top + plotHeight - (point.revenue / max) * plotHeight

      return { x, y, point, index }
    })

    const gridLines = Array.from({ length: gridSteps + 1 }, (_, step) => {
      const ratio = step / gridSteps
      const value = max * (1 - ratio)
      const y = CHART.padding.top + plotHeight * ratio
      return { value, y }
    })

    const linePath = buildSmoothPath(coords)
    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x} ${CHART.padding.top + plotHeight} L ${coords[0].x} ${CHART.padding.top + plotHeight} Z`
        : ''

    const labelIndices = getVisibleLabelIndices(points.length)

    return { coords, gridLines, linePath, areaPath, max, plotHeight, labelIndices }
  }, [points])

  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0)
  const totalSales = points.reduce((sum, point) => sum + point.sales_count, 0)
  const activePoint = activeIndex != null ? chartMetrics.coords[activeIndex] : null

  const handlePointer = useCallback(
    (clientX: number) => {
      const svg = chartRef.current
      if (!svg || chartMetrics.coords.length === 0) return

      const rect = svg.getBoundingClientRect()
      const relativeX = ((clientX - rect.left) / rect.width) * CHART.width

      let nearest = 0
      let nearestDistance = Number.POSITIVE_INFINITY

      chartMetrics.coords.forEach((coord) => {
        const distance = Math.abs(coord.x - relativeX)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = coord.index
        }
      })

      setActiveIndex(nearest)
    },
    [chartMetrics.coords],
  )

  if (points.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <p className="px-5 py-10 text-center text-sm text-slate-500">Henüz veri yok.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 via-white to-amber-50/50 px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Noktaların üzerine gelerek günlük ciroyu görün
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Toplam ciro</p>
            <p className="text-lg font-bold text-brand-700">{valueFormatter(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Satış adedi</p>
            <p className="text-lg font-bold text-slate-900">{totalSales}</p>
          </div>
        </div>
      </div>

      <div className="relative px-2 pb-4 pt-2 sm:px-4">
        {activePoint && (
          <div
            className="pointer-events-none absolute z-20 min-w-[148px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-panel"
            style={{
              left: `${(activePoint.x / CHART.width) * 100}%`,
              top: `${Math.max((activePoint.y / CHART.height) * 100 - 18, 4)}%`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {formatTooltipDate(activePoint.point)}
            </p>
            <p className="mt-0.5 text-base font-bold text-brand-700">
              {valueFormatter(activePoint.point.revenue)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {activePoint.point.sales_count} satış
            </p>
          </div>
        )}

        <svg
          ref={chartRef}
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label={title}
          onMouseLeave={() => setActiveIndex(null)}
          onMouseMove={(event) => handlePointer(event.clientX)}
          onTouchStart={(event) => {
            const touch = event.touches[0]
            if (touch) handlePointer(touch.clientX)
          }}
          onTouchMove={(event) => {
            const touch = event.touches[0]
            if (touch) handlePointer(touch.clientX)
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {chartMetrics.gridLines.map((grid) => (
            <g key={grid.y}>
              <line
                x1={CHART.padding.left}
                y1={grid.y}
                x2={CHART.width - CHART.padding.right}
                y2={grid.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={CHART.padding.left - 10}
                y={grid.y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {formatAxisMoney(grid.value)}
              </text>
            </g>
          ))}

          <path d={chartMetrics.areaPath} fill={`url(#${gradientId})`} />
          <path
            d={chartMetrics.linePath}
            fill="none"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activePoint && (
            <line
              x1={activePoint.x}
              y1={CHART.padding.top}
              x2={activePoint.x}
              y2={CHART.padding.top + chartMetrics.plotHeight}
              stroke="#0f766e"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.45"
            />
          )}

          {chartMetrics.coords.map((coord) => {
            const isActive = activeIndex === coord.index
            const pointKey = coord.point.date ?? `${coord.point.label}-${coord.index}`

            return (
              <g key={pointKey}>
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="14"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(coord.index)}
                />
                {isActive && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="10"
                    fill="#0f766e"
                    opacity="0.12"
                  />
                )}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isActive ? 6 : 4.5}
                  fill="#fff"
                  stroke="#0f766e"
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-all duration-150"
                />
              </g>
            )
          })}

          {chartMetrics.labelIndices.map((index) => {
            const coord = chartMetrics.coords[index]
            if (!coord) return null

            return (
              <text
                key={`label-${coord.point.date ?? index}`}
                x={coord.x}
                y={CHART.height - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-medium"
              >
                {coord.point.short_label && points.length > 14
                  ? coord.point.short_label
                  : coord.point.label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
