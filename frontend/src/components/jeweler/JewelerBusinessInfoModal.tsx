import { FormEvent, useEffect, useState } from 'react'
import { updateJewelerProfile } from '../../api/jewelerStaff'
import { useAuth } from '../../store/AuthStore'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import Button from '../Button'
import Input from '../Input'

interface JewelerBusinessInfoModalProps {
  onClose: () => void
  onSaved: () => void
}

export default function JewelerBusinessInfoModal({ onClose, onSaved }: JewelerBusinessInfoModalProps) {
  useBodyScrollLock(true)

  const { restaurant, updateRestaurant } = useAuth()
  const [name, setName] = useState(restaurant?.name ?? '')
  const [contactPerson, setContactPerson] = useState(restaurant?.contact_person ?? '')
  const [phone, setPhone] = useState(restaurant?.phone ?? '')
  const [address, setAddress] = useState(restaurant?.address ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(restaurant?.name ?? '')
    setContactPerson(restaurant?.contact_person ?? '')
    setPhone(restaurant?.phone ?? '')
    setAddress(restaurant?.address ?? '')
  }, [restaurant])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('İşletme adı zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      const payload = await updateJewelerProfile({
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      })
      updateRestaurant({
        ...restaurant!,
        ...payload.restaurant,
      })
      onSaved()
      onClose()
    } catch {
      setError('İşletme bilgileri güncellenemedi.')
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
        aria-labelledby="business-info-modal-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="business-info-modal-title" className="text-lg font-bold text-slate-900">
              İşletme Bilgilerini Güncelle
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Değişiklikler kaydedildikten sonra profil kartında görünür.
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
          <Input
            label="İşletme adı"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Örn: Altın Kuyumculuk"
          />
          <Input
            label="Yetkili kişi"
            value={contactPerson}
            onChange={(event) => setContactPerson(event.target.value)}
            placeholder="Ad Soyad"
          />
          <Input
            label="Telefon"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="05xx xxx xx xx"
          />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Adres</span>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={3}
              className="input-field w-full resize-y px-3 py-2"
              placeholder="İşletme adresi"
            />
          </label>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Giriş e-postası: <strong className="text-slate-900">{restaurant?.email}</strong>
            <span className="mt-1 block text-xs text-slate-500">E-posta değişikliği için destek ile iletişime geçin.</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
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
