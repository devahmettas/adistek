import { useCallback, useEffect, useState } from 'react'
import { getRestaurantStats, type RestaurantStats } from '../../api/stats'
import Card from '../../components/Card'
import HourlyLineChart from '../../components/HourlyLineChart'
import Input from '../../components/Input'
import { TableDensitySection, WaiterPerformanceSection } from '../../components/StatsSections'

function formatMoney(value: number): string {
  return `${value.toFixed(2)} ₺`
}

function BarChart({
  items,
  valueKey,
  labelKey,
}: {
  items: { [key: string]: string | number }[]
  valueKey: string
  labelKey: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz veri yok.</p>
  }

  const max = Math.max(...items.map((item) => Number(item[valueKey])), 1)

  return (
    <div className="flex h-44 items-end gap-2">
      {items.map((item) => {
        const value = Number(item[valueKey])
        const height = Math.max((value / max) * 100, value > 0 ? 8 : 0)

        return (
          <div key={String(item[labelKey]) + String(item[valueKey])} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-blue-500 transition-all"
                style={{ height: `${height}%` }}
                title={formatMoney(value)}
              />
            </div>
            <span className="text-center text-[10px] font-medium text-gray-500 sm:text-xs">
              {item[labelKey]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function StatsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [stats, setStats] = useState<RestaurantStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      setStats(await getRestaurantStats(selectedDate))
    } catch {
      if (!silent) {
        setError('İstatistikler yüklenemedi.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [selectedDate])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadStats(true)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [loadStats])

  const summary = stats?.summary
  const live = stats?.live

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İstatistikler</h1>
          <p className="mt-1 text-sm text-gray-600">
            Günlük ciro, garson performansı, masa yoğunluğu ve satış analizleri.
          </p>
        </div>

        <div className="w-full sm:w-48">
          <Input
            label="Tarih"
            name="statsDate"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Günlük Ciro">
              <p className="text-3xl font-bold text-blue-700">{formatMoney(summary?.revenue ?? 0)}</p>
              <p className="mt-1 text-xs text-gray-500">Seçilen gün kapanan hesaplar</p>
            </Card>
            <Card title="Nakit Tahsilat">
              <p className="text-3xl font-bold text-emerald-700">
                {formatMoney(summary?.cash_revenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {summary?.cash_sessions ?? 0} hesap · nakit ödeme
              </p>
            </Card>
            <Card title="Kart Tahsilat">
              <p className="text-3xl font-bold text-indigo-700">
                {formatMoney(summary?.card_revenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {summary?.card_sessions ?? 0} hesap · kart ödeme
              </p>
            </Card>
            <Card title="Ortalama Hesap">
              <p className="text-3xl font-bold text-gray-900">
                {formatMoney(summary?.average_bill ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Masa başına ortalama</p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Oturulan Masa">
              <p className="text-3xl font-bold text-gray-900">{summary?.table_sessions ?? 0}</p>
              <p className="mt-1 text-xs text-gray-500">Ödenerek kapanan masa sayısı</p>
            </Card>
            <Card title="Satılan Ürün">
              <p className="text-3xl font-bold text-gray-900">{summary?.items_sold ?? 0}</p>
              <p className="mt-1 text-xs text-gray-500">Toplam adet</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Şu An Canlı">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-orange-50 px-4 py-3">
                  <p className="text-xs text-orange-700">Aktif Masa</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {live?.active_tables ?? 0}
                    <span className="text-sm font-normal text-orange-700">
                      {' '}
                      / {live?.total_tables ?? 0}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 px-4 py-3">
                  <p className="text-xs text-indigo-700">Açık Ciro</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {formatMoney(live?.open_revenue ?? 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Son 7 Gün Ciro">
              <BarChart items={stats.last_7_days} valueKey="revenue" labelKey="label" />
            </Card>
          </div>

          <WaiterPerformanceSection data={stats.waiter_performance} />

          <TableDensitySection data={stats.table_density} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="En Çok Satılan Ürünler">
              {stats.top_products.length === 0 ? (
                <p className="text-sm text-gray-500">Bu gün için satış kaydı yok.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.top_products.map((product, index) => (
                    <li
                      key={`${product.product_id ?? 'x'}-${product.product_name}`}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.quantity} adet</p>
                        </div>
                      </div>
                      <p className="font-semibold text-blue-700">{formatMoney(product.revenue)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Kategori Bazında Satış">
              {stats.top_categories.length === 0 ? (
                <p className="text-sm text-gray-500">Bu gün için kategori verisi yok.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.top_categories.map((category) => (
                    <li
                      key={category.category_name}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{category.category_name}</p>
                        <p className="text-xs text-gray-500">{category.quantity} adet</p>
                      </div>
                      <p className="font-semibold text-blue-700">{formatMoney(category.revenue)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Saatlik Ciro">
            <HourlyLineChart items={stats.hourly_revenue} formatMoney={formatMoney} />
          </Card>
        </>
      )}
    </div>
  )
}
