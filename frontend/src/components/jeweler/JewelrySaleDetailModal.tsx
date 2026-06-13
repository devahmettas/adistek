import Button from '../Button'
import JewelrySaleItemThumb from './JewelrySaleItemThumb'
import type { JewelrySale } from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import { getPaymentLabel, getSaleItemCategoryName } from '../../utils/jewelrySalesAnalytics'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { formatPanelMoney } from '../restaurant/ManagementPanelWidgets'

interface JewelrySaleDetailModalProps {
  sale: JewelrySale
  onClose: () => void
}

export default function JewelrySaleDetailModal({ sale, onClose }: JewelrySaleDetailModalProps) {
  useBodyScrollLock(true)

  const itemCount = (sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
  const totalCost = (sale.items ?? []).reduce((sum, item) => sum + Number(item.line_cost || 0), 0)
  const grossProfit = Number(sale.total) - totalCost

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-detail-title"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="sale-detail-title" className="text-xl font-bold text-slate-900">
                Satış #{sale.sale_number}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(sale.sold_at).toLocaleString('tr-TR')}
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
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {getPaymentLabel(sale.payment_method)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {itemCount} ürün
            </span>
            {sale.customer && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                {sale.customer.name}
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
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Adet</th>
                  <th className="px-4 py-3 text-right">Satış</th>
                  <th className="px-4 py-3 text-right">Maliyet</th>
                  <th className="px-4 py-3 text-right">Kar</th>
                  <th className="px-4 py-3 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sale.items ?? []).map((item) => {
                  const lineCost = Number(item.line_cost) || 0
                  const lineProfit = Number(item.line_total) - lineCost

                  return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <JewelrySaleItemThumb
                          imagePath={item.product?.image_path}
                          name={item.product_name}
                          size="sm"
                        />
                        <span className="font-medium text-slate-900">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getSaleItemCategoryName(sale, item)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatJewelryMoney(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatJewelryMoney(item.unit_cost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${lineProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatJewelryMoney(lineProfit)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatJewelryMoney(item.line_total)}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {sale.notes && (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Not</p>
              <p className="mt-1 whitespace-pre-wrap">{sale.notes}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Ara toplam</dt>
              <dd className="font-medium text-slate-900">{formatPanelMoney(Number(sale.subtotal))}</dd>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">İndirim</dt>
                <dd className="font-medium text-red-600">-{formatPanelMoney(Number(sale.discount))}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-900">Tahsil edilen</dt>
              <dd className="text-lg font-bold text-brand-700">{formatPanelMoney(Number(sale.total))}</dd>
            </div>
            {totalCost > 0 && (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Toplam maliyet</dt>
                  <dd className="font-medium text-slate-900">{formatPanelMoney(totalCost)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Net kar</dt>
                  <dd className={`font-semibold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatPanelMoney(grossProfit)}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <Button type="button" variant="secondary" className="mt-4" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )
}
