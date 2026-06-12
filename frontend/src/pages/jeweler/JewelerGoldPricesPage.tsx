import { FormEvent, useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { createJewelryGoldPrice, getJewelryGoldPrices, type JewelryGoldPrice } from '../../api/jeweler'

export default function JewelerGoldPricesPage() {
  const [prices, setPrices] = useState<JewelryGoldPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [karat, setKarat] = useState('22')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPrices(await getJewelryGoldPrices())
    } catch {
      setError('Altın fiyatları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createJewelryGoldPrice({
        metal_type: 'gold',
        karat: Number(karat),
        buy_price_per_gram: buyPrice,
        sell_price_per_gram: sellPrice,
        source: 'Manuel',
        effective_at: new Date().toISOString(),
      })
      setBuyPrice('')
      setSellPrice('')
      await load()
    } catch {
      setError('Fiyat kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Altın Fiyatları" description="Güncel altın alış ve satış fiyatları" />
      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Yeni Fiyat Kaydı">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Input label="Ayar" type="number" value={karat} onChange={(e) => setKarat(e.target.value)} />
            <Input label="Alış (₺/gr)" type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} required />
            <Input label="Satış (₺/gr)" type="number" step="0.01" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} required />
            <Button type="submit" disabled={submitting}>{submitting ? 'Kaydediliyor...' : 'Fiyat Kaydet'}</Button>
          </form>
        </Card>

        <Card title="Fiyat Geçmişi">
          <ul className="divide-y divide-slate-100">
            {prices.map((price) => (
              <li key={price.id} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{price.karat} ayar altın</p>
                  <p className="text-xs text-slate-500">{new Date(price.effective_at).toLocaleString('tr-TR')}</p>
                </div>
                <div className="text-right text-xs">
                  <p>Alış: {Number(price.buy_price_per_gram).toLocaleString('tr-TR')} ₺</p>
                  <p>Satış: {Number(price.sell_price_per_gram).toLocaleString('tr-TR')} ₺</p>
                </div>
              </li>
            ))}
            {prices.length === 0 && !loading && (
              <li className="py-6 text-center text-sm text-slate-500">Henüz fiyat kaydı yok.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
