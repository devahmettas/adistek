import { FormEvent, useEffect, useState } from 'react'
import {
  createJewelerStaff,
  getJewelerPermissionCatalog,
  type JewelerPermissionCatalogItem,
} from '../../api/jewelerStaff'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import Button from '../Button'
import Input from '../Input'
import {
  JEWELER_PERMISSION_DEFAULTS,
  type JewelerPermissionKey,
  type JewelerPermissionMap,
} from '../../constants/jewelerPermissions'
import JewelerStaffPermissionsGrid from './JewelerStaffPermissionsGrid'

interface JewelerStaffAddModalProps {
  onClose: () => void
  onCreated: () => void
}

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
}

export default function JewelerStaffAddModal({ onClose, onCreated }: JewelerStaffAddModalProps) {
  useBodyScrollLock(true)

  const [catalog, setCatalog] = useState<JewelerPermissionCatalogItem[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [permissions, setPermissions] = useState<JewelerPermissionMap>(JEWELER_PERMISSION_DEFAULTS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getJewelerPermissionCatalog().then(setCatalog).catch(() => {})
  }, [])

  const togglePermission = (key: JewelerPermissionKey) => {
    setPermissions((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Tüm alanlar zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      await createJewelerStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        permissions,
      })
      onCreated()
      onClose()
    } catch {
      setError('Personel eklenemedi. E-posta benzersiz olmalı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden overscroll-behavior-contain bg-slate-900/50 p-3 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Kapat" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-add-modal-title"
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="staff-add-modal-title" className="text-lg font-bold text-slate-900">
              Yeni Personel Ekle
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Çalışan hesabı oluşturun ve başlangıç yetkilerini belirleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Ad Soyad"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Örn: Ayşe Yılmaz"
            />
            <Input
              label="E-posta"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="calisan@kuyumcu.com"
            />
            <Input
              label="Şifre"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="En az 5 karakter"
            />
          </div>

          <JewelerStaffPermissionsGrid
            permissions={permissions}
            catalog={catalog}
            onToggle={togglePermission}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Ekleniyor...' : 'Personel Ekle'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
