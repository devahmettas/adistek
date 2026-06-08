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
    <div>
      <p
        className={`font-bold tracking-tight ${styles.title} ${
          inverted ? 'text-white' : 'text-slate-900'
        }`}
      >
        <span className={inverted ? 'text-brand-300' : 'text-brand-700'}>Adi</span>
        stek
      </p>
      {subtitle && (
        <p className={`mt-0.5 ${styles.sub} ${inverted ? 'text-slate-400' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
