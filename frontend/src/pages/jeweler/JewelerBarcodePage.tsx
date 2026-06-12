import { FormEvent, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import { lookupBarcode, type JewelryProduct } from '../../api/jeweler'
import { formatPanelMoney } from '../../components/restaurant/ManagementPanelWidgets'

export default function JewelerBarcodePage() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<JewelryProduct | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setProduct(null)
    setSearching(true)
    try {
      setProduct(await lookupBarcode(barcode.trim()))
    } catch {
      setError('Barkoda ait ürün bulunamadı.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Barkod Sistemi" description="Barkod ile ürün sorgulama" />

      <Card title="Barkod Sorgula">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Input label="Barkod" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Barkod okutun veya yazın" required />
          </div>
          <Button type="submit" disabled={searching}>{searching ? 'Aranıyor...' : 'Sorgula'}</Button>
        </form>
      </Card>

      {error && <p className="alert-error">{error}</p>}

      {product && (
        <Card title="Ürün Bilgisi">
          <div className="space-y-2 text-sm">
            <p className="text-lg font-bold text-slate-900">{product.name}</p>
            <p className="font-mono text-amber-700">{product.barcode}</p>
            <p>{product.karat} ayar · {product.weight_gram} gr · Stok: {product.stock_quantity}</p>
            <p className="text-lg font-semibold text-brand-700">{formatPanelMoney(Number(product.sale_price))}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
