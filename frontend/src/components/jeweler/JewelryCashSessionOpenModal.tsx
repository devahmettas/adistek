import { FormEvent, useState } from 'react'
import Button from '../Button'
import MoneyInput from '../MoneyInput'
import Textarea from '../Textarea'
import { openJewelryCashSession, type JewelryCashSessionStatusPayload } from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'
import { formatPanelMoney } from '../restaurant/ManagementPanelWidgets'

interface JewelryCashSessionOpenModalProps {
  status: JewelryCashSessionStatusPayload
  onClose: () => void
  onSuccess: () => void
}

export default function JewelryCashSessionOpenModal({
  status,
  onClose,
  onSuccess,
}: JewelryCashSessionOpenModalProps) {
  useBodyScrollLock(true)

  const [openingBalance, setOpeningBalance] = useState(
    formatMoneyInputFromNumber(status.suggested_opening_balance),
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const parsedBalance = parseMoneyInput(openingBalance)
    if (!openingBalance.trim() || Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Geçerli bir açılış bakiyesi girin.')
      return
    }

    setSubmitting(true)
    try {
      await openJewelryCashSession({
        opening_balance: parsedBalance,
        notes: notes.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Kasa açılışı yapılamadı.')
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
        aria-labelledby="cash-session-open-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="cash-session-open-title" className="text-lg font-bold text-slate-900">
              Kasa Açılışı
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Güne başlamak için kasadaki nakit miktarını sayıp girin.
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

        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
          <p>
            Önerilen açılış: <strong>{formatPanelMoney(status.suggested_opening_balance)}</strong>
          </p>
          <p className="mt-1 text-emerald-800">
            Sistem nakit bakiyesi: {formatPanelMoney(status.current_cash_balance)}
          </p>
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <MoneyInput
            label="Sayılan açılış bakiyesi (₺)"
            name="opening_balance"
            value={openingBalance}
            onValueChange={setOpeningBalance}
            placeholder="0"
            required
            autoFocus
          />

          <Textarea
            label="Açılış notu (isteğe bağlı)"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Örn. Sabah kasa sayımı tamamlandı"
            rows={3}
          />

          {error && <p className="alert-error">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              İptal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Açılıyor...' : 'Kasayı Aç'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
