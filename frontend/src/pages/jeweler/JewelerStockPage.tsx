import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { getJewelryStockMovements, type JewelryStockMovement } from '../../api/jeweler'

const TYPE_LABELS: Record<string, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  adjustment: 'Düzeltme',
  sale: 'Satış',
  return: 'İade',
  repair: 'Tamir',
}

export default function JewelerStockPage() {
  const [movements, setMovements] = useState<JewelryStockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setMovements(await getJewelryStockMovements())
    } catch {
      setError('Stok hareketleri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader title="Stok Yönetimi" description="Ürün stok giriş ve çıkış hareketleri" />
      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      <Card title="Son Stok Hareketleri">
        <ul className="divide-y divide-slate-100">
          {movements.map((movement) => (
            <li key={movement.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{movement.product?.name ?? `Ürün #${movement.product_id}`}</p>
                <p className="text-xs text-slate-500">
                  {TYPE_LABELS[movement.type] ?? movement.type} · {new Date(movement.created_at).toLocaleString('tr-TR')}
                </p>
                {movement.notes && <p className="text-xs text-slate-400">{movement.notes}</p>}
              </div>
              <span className="font-bold text-slate-800">{movement.quantity} adet</span>
            </li>
          ))}
          {movements.length === 0 && !loading && (
            <li className="py-6 text-center text-sm text-slate-500">Henüz stok hareketi yok.</li>
          )}
        </ul>
      </Card>
    </div>
  )
}
