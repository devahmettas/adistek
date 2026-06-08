import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
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
    <AuthLayout
      title="Süper Admin"
      description="Sistemdeki tüm restoranları ve platform ayarlarını yönetin."
      badge="Yönetici"
      footer={
        <Link to="/login" className="link-brand">
          İşletme girişine dön
        </Link>
      }
    >
      <Card title="Admin Girişi">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-posta"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@adistek.com"
            required
          />
          <Input
            label="Şifre"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="alert-error">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
