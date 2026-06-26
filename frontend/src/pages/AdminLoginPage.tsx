import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import EmailField from '../components/auth/EmailField'
import PasswordField from '../components/auth/PasswordField'
import Button from '../components/Button'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import { useAdminAuth } from '../store/AdminAuthStore'

export default function AdminLoginPage() {
  const { login, isAuthenticated, loading } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <LoadingState fullScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/restaurants" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
    } catch {
      setError('Giriş başarısız. E-posta veya şifreyi kontrol edin.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__body lg:mx-auto lg:max-w-lg lg:flex-none">
        <div className="auth-page__panel lg:mt-0 lg:flex-1 lg:rounded-none">
          <div className="auth-page__panel-inner">
            <div className="auth-page__panel-head">
              <span className="auth-page__badge">Yönetici</span>
              <h2 className="auth-page__panel-title">Süper Admin</h2>
              <p className="auth-page__panel-desc">Sistemdeki tüm işletmeleri yönetin.</p>
            </div>

            <Card title="Admin Girişi" className="!border-0 !bg-transparent !p-0 !shadow-none [&>div:first-child]:hidden">
              <form onSubmit={handleSubmit} className="auth-form">
                <EmailField
                  label="E-posta"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <PasswordField
                  label="Şifre"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                {error && (
                  <div className="auth-form__error" role="alert">
                    <span>{error}</span>
                  </div>
                )}
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'İşleniyor...' : 'Giriş Yap'}
                </Button>
              </form>
            </Card>

            <div className="text-center text-sm text-slate-500 lg:text-left">
              <Link to="/login" className="link-brand">
                İşletme girişine dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
