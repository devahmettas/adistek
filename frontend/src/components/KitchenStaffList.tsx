import { FormEvent, useEffect, useState } from 'react'
import {
  createKitchenStaff,
  deleteKitchenStaff,
  getKitchenStaff,
  updateKitchenStaff,
} from '../api/kitchenStaff'
import type { KitchenStaff } from '../api/types'
import Button from '../components/Button'
import Input from '../components/Input'

export default function KitchenStaffList() {
  const [staff, setStaff] = useState<KitchenStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStaff = async () => {
    setLoading(true)
    try {
      setStaff(await getKitchenStaff())
    } catch {
      setError('Mutfak çalışanları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
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
      await createKitchenStaff({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      setName('')
      setEmail('')
      setPassword('')
      await loadStaff()
    } catch {
      setError('Mutfak çalışanı eklenemedi. E-posta benzersiz olmalı.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (member: KitchenStaff) => {
    try {
      await updateKitchenStaff(member.id, { is_active: !member.is_active })
      await loadStaff()
    } catch {
      window.alert('Durum güncellenemedi.')
    }
  }

  const removeStaff = async (member: KitchenStaff) => {
    if (!window.confirm(`${member.name} silinsin mi?`)) {
      return
    }

    try {
      await deleteKitchenStaff(member.id)
      await loadStaff()
    } catch {
      window.alert('Mutfak çalışanı silinemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <Input
          label="Ad"
          name="kitchenName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Örn: Mehmet"
        />
        <Input
          label="E-posta"
          name="kitchenEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="mutfak@restoran.com"
        />
        <Input
          label="Şifre"
          name="kitchenPassword"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="En az 5 karakter"
        />
        <div className="md:col-span-3">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Ekleniyor...' : 'Mutfak Çalışanı Ekle'}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-gray-500">Henüz mutfak çalışanı eklenmemiş.</p>
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
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-3 py-3 font-medium text-gray-900">{member.name}</td>
                  <td className="px-3 py-3 text-gray-600">{member.email}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        member.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {member.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => toggleActive(member)}>
                        {member.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => removeStaff(member)}>
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
