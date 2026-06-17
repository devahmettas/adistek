import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../Card'
import JewelryPurchaseDetailModal from './JewelryPurchaseDetailModal'
import LoadingState from '../LoadingState'
import { getJewelryPurchases, type JewelryPurchase } from '../../api/jeweler'
import { formatPanelMoney, PanelStatCard } from '../restaurant/ManagementPanelWidgets'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  transfer: 'Havale/EFT',
  card: 'Kart',
}

interface JewelerPurchaseHistorySectionProps {
  onEdit?: (purchase: JewelryPurchase) => void
  refreshKey?: number
}

export default function JewelerPurchaseHistorySection({
  onEdit,
  refreshKey = 0,
}: JewelerPurchaseHistorySectionProps) {
  const [purchases, setPurchases] = useState<JewelryPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<JewelryPurchase | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPurchases(await getJewelryPurchases())
    } catch {
      setError('Alım kayıtları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  const summary = useMemo(() => {
    const totalPaid = purchases.reduce((sum, purchase) => sum + Number(purchase.total), 0)
    const itemCount = purchases.reduce(
      (sum, purchase) => sum + (purchase.items ?? []).reduce((lineSum, item) => lineSum + item.quantity, 0),
      0,
    )
    return {
      count: purchases.length,
      totalPaid,
      itemCount,
    }
  }, [purchases])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {error && <p className="alert-error">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-3">
        <PanelStatCard label="Toplam alım" value={String(summary.count)} hint="Kayıt sayısı" accent="brand" />
        <PanelStatCard label="Alınan kalem" value={String(summary.itemCount)} hint="Ürün adedi" accent="amber" />
        <PanelStatCard label="Ödenen tutar" value={formatPanelMoney(summary.totalPaid)} hint="Tüm alımlar" accent="emerald" />
      </section>

      <Card title={`Alım Kayıtları (${purchases.length})`}>
        {purchases.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Henüz alım kaydı yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {purchases.map((purchase) => {
              const itemLabels = (purchase.items ?? []).map((item) => item.item_description).join(' · ')

              return (
                <li key={purchase.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPurchase(purchase)}
                    className="flex w-full flex-col gap-2 py-4 text-left transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">#{purchase.purchase_number}</p>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          {PAYMENT_LABELS[purchase.payment_method] ?? purchase.payment_method}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(purchase.purchased_at).toLocaleString('tr-TR')}
                        {purchase.customer ? ` · ${purchase.customer.name}` : ''}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">{itemLabels}</p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-lg font-bold text-emerald-700">
                        {formatPanelMoney(Number(purchase.total))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Detay →</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {selectedPurchase && (
        <JewelryPurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onEdit={onEdit ? () => {
            onEdit(selectedPurchase)
            setSelectedPurchase(null)
          } : undefined}
        />
      )}
    </div>
  )
}
