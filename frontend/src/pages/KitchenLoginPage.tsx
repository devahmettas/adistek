import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import { useKitchenAuth } from '../store/KitchenAuthStore'

export default function KitchenLoginPage() {
  const { login, isAuthenticated, loading } = useKitchenAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-sm text-gray-400">Yükleniyor...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/kitchen/dashboard" replace />
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
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Mutfak Girişi</h1>
          <p className="mt-1 text-sm text-gray-400">Gelen siparişleri görüntüleyin ve hazırlayın.</p>
        </div>

        <Card title="Giriş Yap">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mutfak@restoran.com"
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Giriş yapılıyor...' : 'Mutfak Girişi'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="text-orange-400 hover:text-orange-300">
            Restoran yönetici girişi
          </Link>
        </p>
      </div>
    </div>
  )
}
