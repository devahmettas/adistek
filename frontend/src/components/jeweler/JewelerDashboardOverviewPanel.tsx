import { Link } from 'react-router-dom'
import type { JewelerDashboardOverview } from '../../api/jeweler'
import { formatPanelMoney, PanelStatCard } from '../restaurant/ManagementPanelWidgets'
import StatsTrendChart from './StatsTrendChart'

function formatMargin(value: number): string {
  return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function formatWeight(value: number): string {
  return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gr`
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface JewelerDashboardOverviewPanelProps {
  overview: JewelerDashboardOverview
  reportsEnabled: boolean
}

export default function JewelerDashboardOverviewPanel({
  overview,
  reportsEnabled,
}: JewelerDashboardOverviewPanelProps) {
  const { summary, inventory, repairs, customers } = overview

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>Son güncelleme: {formatGeneratedAt(overview.generated_at)}</p>
        {!reportsEnabled && (
          <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800 ring-1 ring-amber-200">
            Detaylı raporlama kapalı — temel özet gösteriliyor
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PanelStatCard
          label="Günlük ciro"
          value={formatPanelMoney(summary.today_revenue)}
          hint={`${summary.today_sales_count} satış · Ort. ${formatPanelMoney(summary.average_sale)}`}
          accent="amber"
        />
        <PanelStatCard
          label="Haftalık ciro"
          value={formatPanelMoney(summary.week_revenue)}
          hint={`${summary.week_sales_count} satış`}
          accent="emerald"
        />
        <PanelStatCard
          label="Aylık ciro"
          value={formatPanelMoney(summary.month_revenue)}
          hint={`${summary.month_sales_count} satış · Ort. ${formatPanelMoney(summary.month_average_sale)}`}
          accent="brand"
        />
        <PanelStatCard
          label="Düşük stok"
          value={String(inventory.low_stock_count)}
          hint={`${inventory.out_of_stock_count} tükenen ürün`}
          accent="violet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MiniMetricCard
          label="Günlük kar"
          value={formatPanelMoney(summary.today_profit)}
          hint={`Marj ${formatMargin(summary.today_profit_margin)}`}
          tone="emerald"
        />
        <MiniMetricCard
          label="Haftalık kar"
          value={formatPanelMoney(summary.week_profit)}
          hint={`Marj ${formatMargin(summary.week_profit_margin)}`}
          tone="emerald"
        />
        <MiniMetricCard
          label="Aylık kar"
          value={formatPanelMoney(summary.month_profit)}
          hint={`Marj ${formatMargin(summary.month_profit_margin)}`}
          tone="emerald"
        />
        <MiniMetricCard
          label="Envanter değeri"
          value={formatPanelMoney(inventory.inventory_sale_value)}
          hint={`${inventory.total_products} aktif ürün`}
          tone="brand"
        />
        <MiniMetricCard
          label="Stok adedi"
          value={inventory.total_stock_units.toLocaleString('tr-TR')}
          hint={formatWeight(inventory.total_weight_gram)}
          tone="slate"
        />
        <MiniMetricCard
          label="Aktif tamir"
          value={String(repairs.active_count)}
          hint={`${customers.total_count} kayıtlı müşteri`}
          tone="amber"
        />
      </div>

      {(overview.cash_session.is_open || overview.stock_count_active) && (
        <div className="grid gap-3 md:grid-cols-2">
          {overview.cash_session.is_open && (
            <StatusBanner
              to="/dashboard/jeweler/vault"
              title="Kasa açık"
              description={
                overview.cash_session.opened_at
                  ? `${new Date(overview.cash_session.opened_at).toLocaleString('tr-TR')} tarihinde açıldı · Açılış ${formatPanelMoney(overview.cash_session.opening_cash_balance ?? 0)}`
                  : 'Gün sonu kasası aktif'
              }
              tone="emerald"
            />
          )}
          {overview.stock_count_active && (
            <StatusBanner
              to="/dashboard/jeweler/stock-count"
              title="Devam eden stok sayımı"
              description={`${overview.stock_count_active.item_count} kalem · ${overview.stock_count_active.discrepancy_count} fark`}
              tone="amber"
            />
          )}
        </div>
      )}

      <StatsTrendChart
        title="Son 7 gün satış trendi"
        points={overview.revenue_trend}
        valueFormatter={formatPanelMoney}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniMetricCard
          label="Bu ay müşterili satış"
          value={String(customers.month_sales_with_customer)}
          hint={`Toplam ${customers.total_count} müşteri`}
          tone="brand"
        />
        <MiniMetricCard
          label="Günlük maliyet"
          value={formatPanelMoney(summary.today_cost)}
          hint="Satılan ürün maliyeti"
          tone="slate"
        />
        <MiniMetricCard
          label="Haftalık maliyet"
          value={formatPanelMoney(summary.week_cost)}
          hint="Dönem maliyet toplamı"
          tone="slate"
        />
        <MiniMetricCard
          label="Aylık maliyet"
          value={formatPanelMoney(summary.month_cost)}
          hint="Dönem maliyet toplamı"
          tone="slate"
        />
      </div>
    </div>
  )
}

function MiniMetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: 'brand' | 'emerald' | 'amber' | 'slate'
}) {
  const toneClasses = {
    brand: 'border-brand-100 bg-brand-50/40',
    emerald: 'border-emerald-100 bg-emerald-50/40',
    amber: 'border-amber-100 bg-amber-50/40',
    slate: 'border-slate-200 bg-slate-50/60',
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function StatusBanner({
  to,
  title,
  description,
  tone,
}: {
  to: string
  title: string
  description: string
  tone: 'emerald' | 'amber'
}) {
  const toneClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  }

  return (
    <Link
      to={to}
      className={`block rounded-2xl border px-4 py-3 transition hover:shadow-sm ${toneClasses[tone]}`}
    >
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs opacity-90">{description}</p>
    </Link>
  )
}
