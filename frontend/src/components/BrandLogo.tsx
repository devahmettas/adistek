interface BrandLogoProps {
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  inverted?: boolean
}

const sizes = {
  sm: { title: 'text-base', sub: 'text-xs' },
  md: { title: 'text-lg', sub: 'text-sm' },
  lg: { title: 'text-2xl', sub: 'text-sm' },
}

export default function BrandLogo({ subtitle, size = 'md', inverted = false }: BrandLogoProps) {
  const styles = sizes[size]

  return (
    <div className="min-w-0">
      <p
        className={`font-display font-bold tracking-tight ${styles.title} ${
          inverted ? 'text-white' : 'text-slate-900'
        }`}
      >
        <span className={inverted ? 'text-brand-300' : 'text-brand-600'}>Adi</span>
        stek
      </p>
      {subtitle && (
        <p className={`mt-0.5 truncate ${styles.sub} ${inverted ? 'text-slate-200' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
