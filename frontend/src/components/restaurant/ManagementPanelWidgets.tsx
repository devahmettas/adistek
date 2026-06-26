import { Link } from 'react-router-dom'
import NavIcon from '../icons/NavIcon'
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

const accentBarMap = {
  brand: 'bg-brand-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
}

const accentTextMap = {
  brand: 'text-brand-700',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  violet: 'text-violet-700',
}

export function PanelStatCard({ label, value, hint, accent = 'brand' }: PanelStatCardProps) {
  return (
    <div className="stat-card py-5">
      <div className={`stat-card__accent ${accentBarMap[accent]}`} />
      <div className="pl-5 pr-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className={`mt-2 text-2xl font-bold tracking-tight text-slate-900 ${accentTextMap[accent]}`}>
          {value}
        </p>
        {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </div>
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
        className="group flex items-start gap-4 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-amber-200 hover:bg-amber-50/60"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
          <NavIcon name="🔒" />
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
      className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200/60 hover:shadow-card-hover"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition group-hover:border-brand-200 group-hover:bg-brand-100">
        <NavIcon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900">{title}</p>
          {badge && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/60">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
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
      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200/60 hover:shadow-card-hover"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-sm">
          <NavIcon name={icon} className="text-white" />
        </span>
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
              </svg>
            </span>
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
      <p className="text-sm text-slate-400">Aktif modül bulunmuyor. Yöneticinizle iletişime geçin.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {active.map((feature) => (
        <span
          key={feature.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {feature.title}
        </span>
      ))}
    </div>
  )
}
