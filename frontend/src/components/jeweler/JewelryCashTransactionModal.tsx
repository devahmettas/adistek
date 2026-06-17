import { FormEvent, useEffect, useState } from 'react'
import Button from '../Button'
import MoneyInput from '../MoneyInput'
import Select from '../Select'
import Textarea from '../Textarea'
import {
  createJewelryCashTransaction,
  updateJewelryCashTransaction,
  type JewelryVaultCashTransaction,
} from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'

interface JewelryCashTransactionModalProps {
  type?: 'in' | 'out'
  transaction?: JewelryVaultCashTransaction | null
  onClose: () => void
  onSuccess: () => void
}

const TYPE_OPTIONS = [
  { value: 'in', label: 'Giriş' },
  { value: 'out', label: 'Çıkış' },
]

export default function JewelryCashTransactionModal({
  type: initialType = 'in',
  transaction = null,
  onClose,
  onSuccess,
}: JewelryCashTransactionModalProps) {
  useBodyScrollLock(true)

  const isEditing = transaction !== null

  const [type, setType] = useState<'in' | 'out'>(transaction?.type ?? initialType)
  const [amount, setAmount] = useState(
    transaction ? formatMoneyInputFromNumber(transaction.amount) : '',
  )
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(formatMoneyInputFromNumber(transaction.amount))
      setNotes(transaction.notes ?? '')
    }
  }, [transaction])

  const title = isEditing
    ? 'Nakit Düzenle'
    : type === 'in'
      ? 'Nakit Girişi'
      : 'Nakit Çıkışı'

  const submitLabel = isEditing
    ? 'Kaydet'
    : type === 'in'
      ? 'Giriş Kaydet'
      : 'Çıkış Kaydet'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const parsedAmount = parseMoneyInput(amount)
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Geçerli bir tutar girin.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        type,
        amount: parsedAmount,
        notes: notes.trim() || undefined,
      }

      if (isEditing && transaction) {
        await updateJewelryCashTransaction(transaction.id, payload)
      } else {
        await createJewelryCashTransaction(payload)
      }

      onSuccess()
      onClose()
    } catch {
      setError(isEditing ? 'Nakit işlemi güncellenemedi.' : 'Nakit işlemi kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden overscroll-behavior-contain bg-slate-900/50 p-3 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-transaction-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="cash-transaction-title" className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? 'Manuel nakit işlemini güncelleyin.'
                : type === 'in'
                  ? 'Kasaya manuel nakit girişi kaydedin.'
                  : 'Kasadan manuel nakit çıkışı kaydedin.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {isEditing && (
            <Select
              label="İşlem Türü"
              value={type}
              onChange={(event) => setType(event.target.value as 'in' | 'out')}
              options={TYPE_OPTIONS}
            />
          )}

          <MoneyInput
            label="Tutar (₺)"
            name="amount"
            value={amount}
            onValueChange={setAmount}
            placeholder="0"
            required
            autoFocus
          />

          <Textarea
            label="Açıklama"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={type === 'in' ? 'Örn. Gün sonu kasa sayımı' : 'Örn. Masraf ödemesi'}
            rows={3}
          />

          {error && <p className="alert-error">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              İptal
            </Button>
            <Button
              type="submit"
              variant={type === 'out' && !isEditing ? 'danger' : 'primary'}
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
