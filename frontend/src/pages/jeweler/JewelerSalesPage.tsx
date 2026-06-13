import { useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { getJewelrySales, type JewelrySale } from '../../api/jeweler'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'
import { formatPanelMoney } from '../../components/restaurant/ManagementPanelWidgets'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale/EFT',
  gold_exchange: 'Altın Takas',
}

export default function JewelerSalesPage() {
  const { itemCount, openCheckout, saleVersion } = useJewelrySaleCart()
  const [sales, setSales] = useState<JewelrySale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSales(await getJewelrySales())
    } catch {
      setError('Satışlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, saleVersion])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satış Yönetimi"
        description="Çoklu ürün satışı için sepeti kullanın, tamamlanan kayıtları buradan takip edin."
        actions={(
          <Button type="button" onClick={openCheckout}>
            {itemCount > 0 ? `Sepeti Aç (${itemCount})` : 'Yeni Satış'}
          </Button>
        )}
      />
      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {itemCount > 0 && (
        <Card title="Aktif Sepet">
          <p className="text-sm text-slate-600">
            Sepetinizde {itemCount} ürün bekliyor. Ödeme ve indirim ayarlarını yapıp tek seferde satışı tamamlayabilirsiniz.
          </p>
          <Button type="button" className="mt-3" onClick={openCheckout}>
            Sepeti Aç
          </Button>
        </Card>
      )}

      <Card title={`Satış Listesi (${sales.length})`}>
        <ul className="divide-y divide-slate-100">
          {sales.map((sale) => (
            <li key={sale.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">#{sale.sale_number}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.sold_at).toLocaleString('tr-TR')} · {PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
                  </p>
                  {sale.customer && (
                    <p className="text-xs text-slate-600">Müşteri: {sale.customer.name}</p>
                  )}
                </div>
                <p className="text-lg font-bold text-brand-700">{formatPanelMoney(Number(sale.total))}</p>
              </div>
              {sale.items && sale.items.length > 0 && (
                <ul className="mt-2 space-y-1 pl-3 text-xs text-slate-600">
                  {sale.items.map((item) => (
                    <li key={item.id}>
                      {item.product_name} × {item.quantity} — {formatPanelMoney(Number(item.line_total))}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {sales.length === 0 && !loading && (
            <li className="py-6 text-center text-sm text-slate-500">Henüz satış kaydı yok.</li>
          )}
        </ul>
      </Card>
    </div>
  )
}
