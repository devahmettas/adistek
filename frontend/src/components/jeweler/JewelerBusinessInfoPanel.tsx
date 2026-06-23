import { useState } from 'react'
import { useAuth } from '../../store/AuthStore'
import Button from '../Button'
import JewelerBusinessInfoModal from './JewelerBusinessInfoModal'

function displayValue(value?: string | null) {
  return value?.trim() ? value : '—'
}

export default function JewelerBusinessInfoPanel() {
  const { restaurant } = useAuth()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-slate-500">İşletme adı</dt>
          <dd className="font-medium text-slate-900">{displayValue(restaurant?.name)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">E-posta</dt>
          <dd className="font-medium text-slate-900">{displayValue(restaurant?.email)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Yetkili kişi</dt>
          <dd className="font-medium text-slate-900">{displayValue(restaurant?.contact_person)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Telefon</dt>
          <dd className="font-medium text-slate-900">{displayValue(restaurant?.phone)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Adres</dt>
          <dd className="font-medium text-slate-900 whitespace-pre-wrap">{displayValue(restaurant?.address)}</dd>
        </div>
      </dl>

      <Button type="button" className="mt-4" onClick={() => setShowModal(true)}>
        Güncelle
      </Button>

      {showModal && (
        <JewelerBusinessInfoModal
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </>
  )
}
