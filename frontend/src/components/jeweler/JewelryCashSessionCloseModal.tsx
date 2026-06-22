import { FormEvent, useState } from 'react'
import Button from '../Button'
import MoneyInput from '../MoneyInput'
import Textarea from '../Textarea'
import {
  closeJewelryCashSession,
  type JewelryCashSession,
} from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'
import { formatPanelMoney } from '../restaurant/ManagementPanelWidgets'

interface JewelryCashSessionCloseModalProps {
  session: JewelryCashSession
  onClose: () => void
  onSuccess: () => void
}

function formatDifference(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatPanelMoney(value)}`
}

export default function JewelryCashSessionCloseModal({
  session,
  onClose,
  onSuccess,
}: JewelryCashSessionCloseModalProps) {
  useBodyScrollLock(true)

  const expectedBalance = session.expected_balance ?? session.live_summary?.expected_balance ?? 0
  const [countedBalance, setCountedBalance] = useState(formatMoneyInputFromNumber(expectedBalance))
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedCounted = parseMoneyInput(countedBalance)
  const previewDifference = Number.isNaN(parsedCounted)
    ? null
    : Math.round((parsedCounted - expectedBalance) * 100) / 100

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!countedBalance.trim() || Number.isNaN(parsedCounted) || parsedCounted < 0) {
      setError('Geçerli bir sayım tutarı girin.')
      return
    }

    setSubmitting(true)
    try {
      await closeJewelryCashSession({
        counted_balance: parsedCounted,
        notes: notes.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Gün sonu kapanışı yapılamadı.')
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
        aria-labelledby="cash-session-close-title"
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="cash-session-close-title" className="text-lg font-bold text-slate-900">
              Gün Sonu — Kasa Kapanışı
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Günün özetini kontrol edin, kasayı sayın ve kapanışı tamamlayın.
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

        <section className="mb-4 grid gap-3 sm:grid-cols-2">
          <SummaryCard label="Açılış bakiyesi" value={formatPanelMoney(session.opening_balance)} />
          <SummaryCard label="Beklenen kapanış" value={formatPanelMoney(expectedBalance)} accent />
          <SummaryCard label="Nakit giriş" value={formatPanelMoney(session.session_cash_in)} positive />
          <SummaryCard label="Nakit çıkış" value={formatPanelMoney(session.session_cash_out)} negative />
          <SummaryCard
            label="Nakit satış"
            value={`${session.cash_sale_count} işlem · ${formatPanelMoney(session.cash_sale_total)}`}
          />
          <SummaryCard
            label="Nakit alım"
            value={`${session.cash_purchase_count} işlem · ${formatPanelMoney(session.cash_purchase_total)}`}
          />
        </section>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <MoneyInput
            label="Sayılan kasa tutarı (₺)"
            name="counted_balance"
            value={countedBalance}
            onValueChange={setCountedBalance}
            placeholder="0"
            required
            autoFocus
          />

          {previewDifference !== null && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              Math.abs(previewDifference) < 0.01
                ? 'border-emerald-100 bg-emerald-50 text-emerald-900'
                : previewDifference < 0
                  ? 'border-red-100 bg-red-50 text-red-900'
                  : 'border-amber-100 bg-amber-50 text-amber-900'
            }`}
            >
              {Math.abs(previewDifference) < 0.01
                ? 'Sayım beklenen tutarla uyumlu.'
                : previewDifference < 0
                  ? `Kasada ${formatPanelMoney(Math.abs(previewDifference))} eksik var.`
                  : `Kasada ${formatPanelMoney(previewDifference)} fazla var.`}
              {' '}
              Fark: <strong>{formatDifference(previewDifference)}</strong>
            </div>
          )}

          <Textarea
            label="Kapanış notu (isteğe bağlı)"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Örn. Gün sonu sayımı tamamlandı"
            rows={3}
          />

          {error && <p className="alert-error">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              İptal
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {submitting ? 'Kapanıyor...' : 'Gün Sonunu Al'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent = false,
  positive = false,
  negative = false,
}: {
  label: string
  value: string
  accent?: boolean
  positive?: boolean
  negative?: boolean
}) {
  const valueClass = accent
    ? 'text-brand-700'
    : positive
      ? 'text-emerald-700'
      : negative
        ? 'text-red-700'
        : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}
