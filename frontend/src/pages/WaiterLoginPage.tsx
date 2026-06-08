import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import LoadingState from '../components/LoadingState'
import { useWaiterAuth } from '../store/WaiterAuthStore'

export default function WaiterLoginPage() {
  const { login, isAuthenticated, loading } = useWaiterAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <LoadingState fullScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/waiter/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email.trim(), password)
    } catch {
      setError('Giriş başarısız. E-posta veya şifreyi kontrol edin.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Garson Girişi"
      description="Masaları görüntüleyin, sipariş alın ve servis sürecini yönetin."
      badge="Garson"
      footer={
        <>
          <Link to="/login" className="link-brand">
            İşletme girişi
          </Link>
          {' · '}
          <Link to="/kitchen/login" className="link-brand">
            Mutfak girişi
          </Link>
        </>
      }
    >
      <Card title="Giriş Yap">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-posta"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="garson@restoran.com"
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
            {submitting ? 'Giriş yapılıyor...' : 'Garson Girişi'}
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
