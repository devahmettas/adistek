import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import { useAuth } from '../store/AuthStore'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { login, register, isAuthenticated, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (password !== passwordConfirmation) {
          setError('Şifreler eşleşmiyor.')
          setSubmitting(false)
          return
        }

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        })
      }
    } catch {
      setError(
        mode === 'login'
          ? 'Giriş başarısız. E-posta veya şifreyi kontrol edin.'
          : 'Kayıt başarısız. Bilgileri kontrol edin.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Menu Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Restoranınıza giriş yapın ve menünüzü yönetin.
          </p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Giriş
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <Card title={mode === 'login' ? 'Giriş Yap' : 'Restoran Kaydı'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Restoran Adı"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Örn: Adistek Cafe"
                required
              />
            )}
            <Input
              label="E-posta"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@restoran.com"
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
            {mode === 'register' && (
              <Input
                label="Şifre Tekrar"
                name="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting
                ? 'İşleniyor...'
                : mode === 'login'
                  ? 'Giriş Yap'
                  : 'Kayıt Ol'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500">
          <Link to="/waiter/login" className="text-blue-600 hover:text-blue-700">
            Garson girişi
          </Link>
          {' · '}
          <Link to="/admin/login" className="text-blue-600 hover:text-blue-700">
            Süper Admin girişi
          </Link>
        </p>
      </div>
    </div>
  )
}
