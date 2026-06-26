import authHeroImage from '../assets/auth-hero-jeweler.png'
import BrandLogo from './BrandLogo'

interface AuthBrandPanelProps {
  logoSize?: 'md' | 'lg'
  compact?: boolean
}

export function AuthBrandCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-300/90 sm:text-[11px]">
          Kuyumcu yönetimi
        </p>
        <h2
          className={`mt-1 font-display font-bold leading-tight tracking-tight text-white ${
            compact ? 'text-lg sm:text-xl' : 'mt-2 text-2xl xl:text-3xl'
          }`}
        >
          Stok ve satışınızı tek panelden yönetin
        </h2>
        <p
          className={`max-w-md leading-relaxed text-slate-300/90 ${
            compact ? 'mt-1 text-xs sm:text-sm' : 'mt-2 text-sm'
          }`}
        >
          Ürün takibi, kasa yönetimi ve müşteri kartları — hepsi Adistek ile.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {['Stok', 'Satış', 'Kasa', 'Müşteri'].map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/20 bg-black/25 px-2.5 py-0.5 text-[11px] font-medium text-slate-100 backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AuthBrandBackdrop() {
  return (
    <>
      <img
        src={authHeroImage}
        alt=""
        className="auth-brand__photo"
        loading="eager"
        decoding="async"
      />
      <div className="auth-brand__overlay" aria-hidden />
    </>
  )
}

export default function AuthBrandPanel({ logoSize = 'lg', compact = false }: AuthBrandPanelProps) {
  return (
    <div className="auth-brand">
      <AuthBrandBackdrop />
      <div className="auth-brand__content">
        <BrandLogo size={logoSize} inverted />
        <div className="mt-auto">
          <AuthBrandCopy compact={compact} />
        </div>
      </div>
    </div>
  )
}
