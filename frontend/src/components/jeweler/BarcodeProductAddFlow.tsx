import { FormEvent, useCallback, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import Input from '../Input'
import BarcodeScannerModal from './BarcodeScannerModal'
import ProductBarcode from './ProductBarcode'
import SaleBarcodeScanButton from './SaleBarcodeScanButton'
import {
  checkBarcodeAvailability,
  type JewelryProduct,
} from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'

interface BarcodeProductAddFlowProps {
  onBarcodeConfirmed: (barcode: string) => void
  onEditExisting: (product: JewelryProduct) => void
  onCancel: () => void
}

function ScanIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10" />
    </svg>
  )
}

export default function BarcodeProductAddFlow({
  onBarcodeConfirmed,
  onEditExisting,
  onCancel,
}: BarcodeProductAddFlowProps) {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingProduct, setExistingProduct] = useState<JewelryProduct | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const verifyBarcode = useCallback(async (rawCode: string) => {
    const code = rawCode.trim()
    if (!code) {
      setError('Lütfen barkod girin veya okutun.')
      setExistingProduct(null)
      return
    }

    setChecking(true)
    setError(null)
    setExistingProduct(null)

    try {
      const result = await checkBarcodeAvailability(code)

      if (result.available) {
        onBarcodeConfirmed(result.barcode)
        return
      }

      if (result.product) {
        setExistingProduct(result.product)
        setBarcodeInput(result.barcode)
        setError('Bu barkod zaten sisteme kayıtlı. Mevcut ürünü düzenleyebilir veya farklı bir barkod deneyebilirsiniz.')
        return
      }

      setError('Barkod kontrol edilemedi. Tekrar deneyin.')
    } catch {
      setError('Barkod kontrol edilemedi. Bağlantınızı kontrol edip tekrar deneyin.')
    } finally {
      setChecking(false)
    }
  }, [onBarcodeConfirmed])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void verifyBarcode(barcodeInput)
  }

  const handleScan = (code: string) => {
    setScannerOpen(false)
    setBarcodeInput(code)
    void verifyBarcode(code)
  }

  return (
    <>
      <Card title="Üretim Barkodu ile Ürün Ekle">
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-brand-50/40 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <ScanIcon />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Üretimden gelen barkodu olduğu gibi kaydedin
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Atölyeden veya üreticiden barkodlu gelen ürünleri, barkodu değiştirmeden sisteme tanımlayın.
                  Önce barkodu okutun; ardından ürün bilgilerini girip kaydedin.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Input
                label="Barkod"
                value={barcodeInput}
                onChange={(event) => {
                  setBarcodeInput(event.target.value)
                  setError(null)
                  setExistingProduct(null)
                }}
                placeholder="Barkodu yazın veya okutun..."
                autoComplete="off"
                autoFocus
              />
              <SaleBarcodeScanButton
                onClick={() => setScannerOpen(true)}
                disabled={checking}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {existingProduct && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kayıtlı ürün</p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{existingProduct.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {existingProduct.weight_gram} gr · {formatJewelryMoney(existingProduct.sale_price)}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-500">{existingProduct.barcode}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
                    <ProductBarcode value={existingProduct.barcode} size="sm" showValue />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onEditExisting(existingProduct)}
                  >
                    Bu Ürünü Düzenle
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={checking || !barcodeInput.trim()}>
                {checking ? 'Kontrol ediliyor...' : 'Barkodu Onayla ve Devam Et'}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                Vazgeç
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {scannerOpen && (
        <BarcodeScannerModal
          onClose={() => setScannerOpen(false)}
          onScan={handleScan}
        />
      )}
    </>
  )
}

interface BarcodeProductBannerProps {
  barcode: string
  onChangeBarcode: () => void
}

export function BarcodeProductBanner({ barcode, onChangeBarcode }: BarcodeProductBannerProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-amber-50/60 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Kaydedilecek üretim barkodu
          </p>
          <p className="break-all font-mono text-lg font-bold text-slate-900">{barcode}</p>
          <p className="text-xs text-slate-500">
            Bu barkod ürün kaydıyla birlikte değiştirilmeden sisteme eklenecek.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-end">
          <div className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
            <ProductBarcode value={barcode} size="md" showValue />
          </div>
          <button
            type="button"
            onClick={onChangeBarcode}
            className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            Farklı barkod kullan
          </button>
        </div>
      </div>
    </div>
  )
}
