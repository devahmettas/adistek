import { FormEvent, useEffect, useState } from 'react'
import { createWaiter, deleteWaiter, getWaiters, updateWaiter } from '../api/waiters'
import type { Waiter } from '../api/types'
import Button from './Button'
import Input from './Input'

export default function WaiterList() {
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWaiters = async () => {
    setLoading(true)
    try {
      setWaiters(await getWaiters())
    } catch {
      setError('Garsonlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaiters()
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Tüm alanlar zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      await createWaiter({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      setName('')
      setEmail('')
      setPassword('')
      await loadWaiters()
    } catch {
      setError('Garson eklenemedi. E-posta benzersiz olmalı.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (waiter: Waiter) => {
    try {
      await updateWaiter(waiter.id, { is_active: !waiter.is_active })
      await loadWaiters()
    } catch {
      window.alert('Garson durumu güncellenemedi.')
    }
  }

  const removeWaiter = async (waiter: Waiter) => {
    if (!window.confirm(`${waiter.name} silinsin mi?`)) {
      return
    }

    try {
      await deleteWaiter(waiter.id)
      await loadWaiters()
    } catch {
      window.alert('Garson silinemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <Input
          label="Garson Adı"
          name="waiterName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Örn: Ahmet"
        />
        <Input
          label="E-posta"
          name="waiterEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="garson@restoran.com"
        />
        <Input
          label="Şifre"
          name="waiterPassword"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="En az 5 karakter"
        />
        <div className="md:col-span-3">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Ekleniyor...' : 'Garson Ekle'}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Garsonlar yükleniyor...</p>
      ) : waiters.length === 0 ? (
        <p className="text-sm text-gray-500">Henüz garson eklenmemiş.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2">Ad</th>
                <th className="px-3 py-2">E-posta</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {waiters.map((waiter) => (
                <tr key={waiter.id}>
                  <td className="px-3 py-3 font-medium text-gray-900">{waiter.name}</td>
                  <td className="px-3 py-3 text-gray-600">{waiter.email}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        waiter.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {waiter.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => toggleActive(waiter)}
                      >
                        {waiter.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => removeWaiter(waiter)}>
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
