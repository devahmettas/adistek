import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import EmailField from '../components/auth/EmailField'
import LoginScreen, { type LoginRole } from '../components/auth/LoginScreen'
import PasswordField from '../components/auth/PasswordField'
import LoadingState from '../components/LoadingState'
import { getFirstJewelerAccessiblePath } from '../constants/jewelerNav'
import { useAuth } from '../store/AuthStore'

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  if (!error.response) {
    return 'Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.'
  }

  if (error.response.status === 503) {
    const data = error.response.data as { error?: string; fix?: string } | string
    if (typeof data === 'object' && data?.fix) {
      return `${data.error ?? 'Sunucu kurulumu eksik.'} ${data.fix}`
    }
    return 'Sunucu kurulumu eksik. Tarayıcıda /setup.php adresini açıp kurulumu tamamlayın.'
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
  const { login, isAuthenticated, loading, restaurant, isOwner, permissions } = useAuth()
  const [role, setRole] = useState<LoginRole>('owner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <LoadingState fullScreen />
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getFirstJewelerAccessiblePath(restaurant, permissions, isOwner)}
        replace
      />
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email.trim(), password, role === 'staff')
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          'Giriş başarısız. E-posta veya şifreyi kontrol edin.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isStaff = role === 'staff'

  return (
    <LoginScreen
      role={role}
      onRoleChange={setRole}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
    >
      <EmailField
        label="E-posta adresi"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={isStaff ? 'personel@isletme.com' : 'sahip@isletme.com'}
        required
      />
      <PasswordField
        label="Şifre"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
        autoComplete={isStaff ? 'current-password' : 'current-password'}
        required
      />
    </LoginScreen>
  )
}
