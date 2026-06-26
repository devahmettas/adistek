import authHeroImage from '../../assets/auth-hero-jeweler.png'
import BrandLogo from '../BrandLogo'

const FEATURES = [
  {
    icon: '◆',
    title: 'Stok Takibi',
    desc: 'Ürün ve envanter kontrolü',
  },
  {
    icon: '⇅',
    title: 'Alış & Satış',
    desc: 'İşlemleri tek ekrandan yönetin',
  },
  {
    icon: '▤',
    title: 'Kasa',
    desc: 'Nakit ve stok değeri takibi',
  },
  {
    icon: '◉',
    title: 'Müşteri',
    desc: 'Müşteri kartları ve geçmiş',
  },
] as const

interface AuthShowcaseProps {
  variant?: 'desktop' | 'mobile'
}

export default function AuthShowcase({ variant = 'desktop' }: AuthShowcaseProps) {
  const isMobile = variant === 'mobile'

  return (
    <div className={`auth-showcase ${isMobile ? 'auth-showcase--mobile' : 'auth-showcase--desktop'}`}>
      <div className="auth-showcase__media" aria-hidden>
        <img src={authHeroImage} alt="" className="auth-showcase__photo" loading="eager" decoding="async" />
        <div className="auth-showcase__overlay" />
        <div className="auth-showcase__glow auth-showcase__glow--gold" />
        <div className="auth-showcase__glow auth-showcase__glow--teal" />
        <div className="auth-showcase__grain" />
      </div>

      <div className="auth-showcase__content">
        <BrandLogo size={isMobile ? 'md' : 'lg'} inverted />

        <div className="auth-showcase__copy">
          <p className="auth-showcase__eyebrow">Kuyumcu yönetim sistemi</p>
          <h1 className="auth-showcase__title">
            İşletmenizi
            <span className="auth-showcase__title-accent"> tek panelden </span>
            yönetin
          </h1>
          <p className="auth-showcase__lede">
            Stok, satış, kasa ve müşteri yönetimi — güvenli, hızlı ve profesyonel.
          </p>
        </div>

        {!isMobile && (
          <div className="auth-showcase__features">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="auth-showcase__feature">
                <span className="auth-showcase__feature-icon">{feature.icon}</span>
                <div>
                  <p className="auth-showcase__feature-title">{feature.title}</p>
                  <p className="auth-showcase__feature-desc">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isMobile && (
          <div className="auth-showcase__tags">
            {FEATURES.map((feature) => (
              <span key={feature.title} className="auth-showcase__tag">
                {feature.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
