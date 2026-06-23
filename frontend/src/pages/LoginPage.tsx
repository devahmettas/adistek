import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import axios from 'axios'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import LoadingState from '../components/LoadingState'
import { isJewelerBusiness } from '../constants/businessType'
import { getFirstJewelerAccessiblePath } from '../constants/jewelerNav'
import { useAuth } from '../store/AuthStore'

type Mode = 'login' | 'register'
type LoginType = 'owner' | 'staff'

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  if (!error.response) {
    return 'Sunucuya bağlanılamadı. Backend (php artisan serve) çalışıyor mu kontrol edin.'
  }

  const data = error.response.data as {
    message?: string
    errors?: Record<string, string[]>
  }

  if (data.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (firstError) {
      return firstError
    }
  }

  if (data.message) {
    return data.message
  }

  return fallback
}

export default function LoginPage() {
  const { login, register, isAuthenticated, loading, restaurant, isOwner, permissions } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [loginType, setLoginType] = useState<LoginType>('owner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <LoadingState fullScreen />
  }

  if (isAuthenticated) {
    const target = isJewelerBusiness(restaurant?.business_type)
      ? getFirstJewelerAccessiblePath(restaurant, permissions, isOwner)
      : '/dashboard'

    return <Navigate to={target} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password, loginType === 'staff')
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
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          mode === 'login'
            ? 'Giriş başarısız. E-posta veya şifreyi kontrol edin.'
            : 'Kayıt başarısız. Bilgileri kontrol edin.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="İşletme Girişi"
      description="Restoranınıza giriş yapın, menü ve masalarınızı tek panelden yönetin."
      badge="İşletme Sahibi"
      footer={
        <>
          <Link to="/waiter/login" className="link-brand">
            Garson girişi
          </Link>
          {' · '}
          <Link to="/kitchen/login" className="link-brand">
            Mutfak girişi
          </Link>
          {' · '}
          <Link to="/admin/login" className="link-brand">
            Süper admin
          </Link>
        </>
      }
    >
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition min-h-11 ${
            mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Giriş
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setLoginType('owner')
          }}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition min-h-11 ${
            mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Kayıt Ol
        </button>
      </div>

      {mode === 'login' && (
        <div className="flex rounded-xl bg-amber-50 p-1 ring-1 ring-amber-100">
          <button
            type="button"
            onClick={() => setLoginType('owner')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition min-h-10 ${
              loginType === 'owner' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-800/80'
            }`}
          >
            İşletme Sahibi
          </button>
          <button
            type="button"
            onClick={() => setLoginType('staff')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition min-h-10 ${
              loginType === 'staff' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-800/80'
            }`}
          >
            Çalışan Girişi
          </button>
        </div>
      )}

      <Card title={mode === 'login' ? (loginType === 'staff' ? 'Çalışan Girişi' : 'Giriş Yap') : 'Restoran Kaydı'}>
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
          {error && <p className="alert-error">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
