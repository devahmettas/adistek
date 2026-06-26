import { FormEvent, ReactNode } from 'react'
import AuthShowcase from './AuthShowcase'

export type LoginRole = 'owner' | 'staff'

interface LoginScreenProps {
  role: LoginRole
  onRoleChange: (role: LoginRole) => void
  onSubmit: (event: FormEvent) => void
  submitting: boolean
  error: string | null
  children: ReactNode
}

function RoleTab({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`auth-role-tab ${active ? 'auth-role-tab--active' : ''}`}
    >
      <span className="auth-role-tab__label">{label}</span>
      <span className="auth-role-tab__hint">{hint}</span>
    </button>
  )
}

export default function LoginScreen({
  role,
  onRoleChange,
  onSubmit,
  submitting,
  error,
  children,
}: LoginScreenProps) {
  const isStaff = role === 'staff'

  return (
    <div className="auth-page">
      <aside className="auth-page__showcase-desktop">
        <AuthShowcase variant="desktop" />
      </aside>

      <div className="auth-page__body">
        <div className="auth-page__showcase-mobile">
          <AuthShowcase variant="mobile" />
        </div>

        <div className="auth-page__panel">
          <div className="auth-page__panel-inner">
            <div className="auth-page__panel-head">
              <span className="auth-page__badge">Adistek</span>
              <h2 className="auth-page__panel-title">
                {isStaff ? 'Personel Girişi' : 'Hoş Geldiniz'}
              </h2>
              <p className="auth-page__panel-desc">
                {isStaff
                  ? 'Yetkiniz dahilindeki modüllere erişmek için giriş yapın.'
                  : 'Kuyumcu panelinize güvenli şekilde bağlanın.'}
              </p>
            </div>

            <div className="auth-role-switch" role="tablist" aria-label="Giriş türü">
              <RoleTab
                active={!isStaff}
                label="İşletme Sahibi"
                hint="Tam yetki"
                onClick={() => onRoleChange('owner')}
              />
              <RoleTab
                active={isStaff}
                label="Personel"
                hint="Sınırlı erişim"
                onClick={() => onRoleChange('staff')}
              />
            </div>

            <form onSubmit={onSubmit} className="auth-form">
              {children}

              {error && (
                <div className="auth-form__error" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 8v5M12 16h.01" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="auth-form__submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="auth-form__spinner" aria-hidden />
                    Giriş yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>

            <p className="auth-page__secure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path strokeLinecap="round" d="M12 3 4 7v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4Z" />
              </svg>
              SSL ile korunan güvenli bağlantı
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
