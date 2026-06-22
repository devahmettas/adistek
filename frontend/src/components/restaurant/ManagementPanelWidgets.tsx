import { Link } from 'react-router-dom'
import {
  RESTAURANT_FEATURE_OPTIONS,
  isRestaurantFeatureEnabled,
  type RestaurantFeatureKey,
} from '../../constants/restaurantFeatures'

export function formatPanelMoney(value: number): string {
  return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
}

interface PanelStatCardProps {
  label: string
  value: string
  hint?: string
  accent?: 'brand' | 'emerald' | 'amber' | 'violet'
}

const accentMap = {
  brand: 'from-brand-600 to-brand-800',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  violet: 'from-violet-500 to-violet-700',
}

export function PanelStatCard({ label, value, hint, accent = 'brand' }: PanelStatCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className={`bg-gradient-to-br ${accentMap[accent]} px-4 py-3 text-white`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </div>
      {hint && <p className="px-4 py-2 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface PanelActionCardProps {
  to: string
  title: string
  description: string
  icon: string
  badge?: string
  locked?: boolean
}

export function PanelActionCard({ to, title, description, icon, badge, locked = false }: PanelActionCardProps) {
  if (locked) {
    return (
      <Link
        to={to}
        className="group flex items-start gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/60"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-400">
          🔒
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-500">{title}</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Kapalı
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Bu modül kapatılmış. Kullanmak için yöneticinizle iletişime geçin.
          </p>
          <p className="mt-2 text-xs font-semibold text-amber-700 group-hover:text-amber-800">
            Detay →
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-700 transition group-hover:bg-brand-100">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900">{title}</p>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        <p className="mt-2 text-xs font-semibold text-brand-700 group-hover:text-brand-800">
          Aç →
        </p>
      </div>
    </Link>
  )
}

interface PanelSetupCardProps {
  to: string
  title: string
  description: string
  icon: string
  items: string[]
}

export function PanelSetupCard({ to, title, description, icon, items }: PanelSetupCardProps) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl text-white">
          {icon}
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-4 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
        Ayarları yönet →
      </p>
    </Link>
  )
}

const FEATURE_KEY_MAP: Record<string, RestaurantFeatureKey> = {
  feature_order_tracking: 'order_tracking',
  feature_qr_menu: 'qr_menu',
  feature_reservations: 'reservations',
}

interface ActiveFeaturesProps {
  restaurant: {
    feature_order_tracking?: boolean
    feature_qr_menu?: boolean
    feature_reservations?: boolean
  } | null
}

export function ActiveFeaturesBadges({ restaurant }: ActiveFeaturesProps) {
  const active = RESTAURANT_FEATURE_OPTIONS.filter((option) =>
    isRestaurantFeatureEnabled(restaurant, FEATURE_KEY_MAP[option.key]),
  )

  if (active.length === 0) {
    return (
      <p className="text-sm text-slate-500">Aktif modül bulunmuyor. Yöneticinizle iletişime geçin.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {active.map((feature) => (
        <span
          key={feature.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {feature.title}
        </span>
      ))}
    </div>
  )
}
