import Button from '../Button'
import type { JewelryPurchase } from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { formatPanelMoney } from '../restaurant/ManagementPanelWidgets'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale/EFT',
  gold_exchange: 'Altın Takas',
}

interface JewelryPurchaseDetailModalProps {
  purchase: JewelryPurchase
  onClose: () => void
  onEdit?: () => void
}

export default function JewelryPurchaseDetailModal({
  purchase,
  onClose,
  onEdit,
}: JewelryPurchaseDetailModalProps) {
  useBodyScrollLock(true)

  const itemCount = (purchase.items ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center overflow-x-hidden overscroll-behavior-contain bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-detail-title"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="purchase-detail-title" className="text-xl font-bold text-slate-900">
                Alım #{purchase.purchase_number}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(purchase.purchased_at).toLocaleString('tr-TR')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {PAYMENT_LABELS[purchase.payment_method] ?? purchase.payment_method}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {itemCount} kalem
            </span>
            {purchase.customer && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                {purchase.customer.name}
              </span>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3 text-right">Gram</th>
                  <th className="px-4 py-3 text-right">Ödeme tutarı</th>
                  <th className="px-4 py-3 text-right">Adet</th>
                  <th className="px-4 py-3 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(purchase.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.item_description}</p>
                      {item.karat && (
                        <p className="text-xs text-slate-500">{item.karat} ayar</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{item.weight_gram} gr</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatJewelryMoney(item.line_total)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatJewelryMoney(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {purchase.notes && (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Not</p>
              <p className="mt-1 whitespace-pre-wrap">{purchase.notes}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-900">Ödenen tutar</dt>
              <dd className="text-lg font-bold text-emerald-700">{formatPanelMoney(Number(purchase.total))}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {onEdit && (
              <Button type="button" onClick={onEdit}>
                Düzenle
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
