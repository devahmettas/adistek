import type { StatsTableDensity, StatsWaiterPerformance } from '../api/stats'
import Card from './Card'

function formatMoney(value: number): string {
  return `${value.toFixed(2)} ₺`
}

function ShareBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

export function WaiterPerformanceSection({
  data,
}: {
  data: StatsWaiterPerformance
}) {
  if (data.waiters.length === 0) {
    return (
      <Card title="Garson Performansı">
        <p className="text-sm text-gray-500">Bu gün için garson performans verisi yok.</p>
      </Card>
    )
  }

  const top = data.top_waiter

  return (
    <div className="space-y-4">
      {top && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Günün En İyi Garsonu
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{top.waiter_name}</p>
              <p className="mt-1 text-sm text-gray-600">
                {top.table_sessions} masa · {top.items_sold} ürün · Ort. {formatMoney(top.average_bill)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-700">{formatMoney(top.revenue)}</p>
              <p className="text-sm text-indigo-600">Cironun %{top.revenue_share}&apos;si</p>
            </div>
          </div>
        </div>
      )}

      <Card title="Garson Performansı">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Garson</th>
                <th className="pb-3 pr-4">Masa</th>
                <th className="pb-3 pr-4">Ürün</th>
                <th className="pb-3 pr-4">Ciro</th>
                <th className="pb-3 pr-4">Ort. Hesap</th>
                <th className="pb-3">Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.waiters.map((waiter, index) => (
                <tr key={`${waiter.waiter_id ?? 'none'}-${waiter.waiter_name}`}>
                  <td className="py-4 pr-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-medium text-gray-900">{waiter.waiter_name}</td>
                  <td className="py-4 pr-4 text-gray-700">{waiter.table_sessions}</td>
                  <td className="py-4 pr-4 text-gray-700">{waiter.items_sold}</td>
                  <td className="py-4 pr-4 font-semibold text-indigo-700">{formatMoney(waiter.revenue)}</td>
                  <td className="py-4 pr-4 text-gray-700">{formatMoney(waiter.average_bill)}</td>
                  <td className="min-w-[120px] py-4">
                    <div className="space-y-1">
                      <ShareBar value={waiter.revenue_share} colorClass="bg-indigo-500" />
                      <p className="text-xs text-gray-500">%{waiter.revenue_share}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function TableDensitySection({ data }: { data: StatsTableDensity }) {
  const summary = data.summary

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase text-orange-700">Anlık Doluluk</p>
          <p className="mt-2 text-2xl font-bold text-orange-900">%{summary.current_occupancy_rate}</p>
          <p className="mt-1 text-xs text-orange-700">
            {summary.current_active_tables} / {summary.total_tables} masa dolu
          </p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase text-violet-700">Günlük Devir</p>
          <p className="mt-2 text-2xl font-bold text-violet-900">%{summary.turnover_rate}</p>
          <p className="mt-1 text-xs text-violet-700">
            Masa başına ort. {summary.average_sessions_per_table} oturum
          </p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase text-teal-700">Yoğun Saat</p>
          <p className="mt-2 text-2xl font-bold text-teal-900">{summary.peak_hour ?? '—'}</p>
          <p className="mt-1 text-xs text-teal-700">
            {summary.peak_hour_sessions > 0
              ? `${summary.peak_hour_sessions} masa kapanışı`
              : 'Veri yok'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase text-slate-700">Toplam Oturum</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.sessions_today}</p>
          <p className="mt-1 text-xs text-slate-600">{summary.total_tables} masalı salon</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Masa Yoğunluğu">
          {data.tables.length === 0 ? (
            <p className="text-sm text-gray-500">Bu gün için masa yoğunluğu verisi yok.</p>
          ) : (
            <ul className="space-y-4">
              {data.tables.map((table, index) => (
                <li key={`${table.table_id ?? 'x'}-${table.table_name}`} className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {index + 1}. {table.table_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {table.sessions} oturum · Ort. {formatMoney(table.average_bill)}
                      </p>
                    </div>
                    <p className="font-bold text-violet-700">{formatMoney(table.revenue)}</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Oturum payı</p>
                      <ShareBar value={table.session_share} colorClass="bg-violet-500" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Ciro payı</p>
                      <ShareBar value={table.revenue_share} colorClass="bg-orange-500" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Saatlik Masa Yoğunluğu">
          {data.hourly_occupancy.length === 0 ? (
            <p className="text-sm text-gray-500">Bu gün için saatlik yoğunluk verisi yok.</p>
          ) : (
            <ul className="space-y-3">
              {data.hourly_occupancy.map((row) => (
                <li key={row.hour}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{row.label}</span>
                    <span className="text-gray-500">
                      {row.sessions} masa · %{row.occupancy_rate}
                    </span>
                  </div>
                  <ShareBar value={row.occupancy_rate} colorClass="bg-teal-500" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
