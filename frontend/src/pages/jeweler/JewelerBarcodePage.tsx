import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import BarcodeScannerModal from '../../components/jeweler/BarcodeScannerModal'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import PageSubNav from '../../components/PageSubNav'
import ProductBarcode from '../../components/jeweler/ProductBarcode'
import {
  getJewelryProducts,
  lookupBarcode,
  type JewelryProduct,
} from '../../api/jeweler'
import { formatPanelMoney } from '../../components/restaurant/ManagementPanelWidgets'
import {
  printJewelryBarcodeLabel,
  printJewelryBarcodeLabels,
  toJewelryBarcodeLabel,
} from '../../utils/jewelryBarcodePrint'
import { formatJewelryMoney } from '../../utils/jewelryPrice'

type BarcodeTab = 'lookup' | 'print'

function ScanIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v7H6z" />
    </svg>
  )
}

export default function JewelerBarcodePage() {
  const [activeTab, setActiveTab] = useState<BarcodeTab>('lookup')
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<JewelryProduct | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [printing, setPrinting] = useState(false)

  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [copies, setCopies] = useState('1')

  const lookupProduct = useCallback(async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return

    setError(null)
    setProduct(null)
    setSearching(true)

    try {
      const result = await lookupBarcode(trimmed)
      setProduct(result)
      setBarcode(trimmed)
    } catch {
      setError('Barkoda ait ürün bulunamadı.')
    } finally {
      setSearching(false)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const list = await getJewelryProducts()
      setProducts(list)
      setSelectedIds((current) => {
        const valid = new Set(list.map((item) => item.id))
        return new Set([...current].filter((id) => valid.has(id)))
      })
    } catch {
      setError('Ürün listesi yüklenemedi.')
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'print' && products.length === 0 && !productsLoading) {
      void loadProducts()
    }
  }, [activeTab, loadProducts, products.length, productsLoading])

  const printableProducts = useMemo(
    () => products.filter((item) => Boolean(item.barcode?.trim())),
    [products],
  )

  const filteredPrintProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase('tr-TR')
    if (!query) return printableProducts

    return printableProducts.filter((item) => {
      const haystack = [
        item.name,
        item.barcode,
        item.category?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR')

      return haystack.includes(query)
    })
  }, [printableProducts, productSearch])

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    await lookupProduct(barcode)
  }

  const handleScan = async (code: string) => {
    setScannerOpen(false)
    await lookupProduct(code)
  }

  const handlePrintProduct = async (item: JewelryProduct) => {
    const label = toJewelryBarcodeLabel(item)
    if (!label) return

    setPrinting(true)
    try {
      await printJewelryBarcodeLabel(label)
    } finally {
      setPrinting(false)
    }
  }

  const handlePrintSelected = async () => {
    const copyCount = Math.max(1, Math.min(20, Number(copies) || 1))
    const labels = products
      .filter((item) => selectedIds.has(item.id))
      .flatMap((item) => {
        const label = toJewelryBarcodeLabel(item)
        if (!label) return []
        return Array.from({ length: copyCount }, () => label)
      })

    if (labels.length === 0) return

    setPrinting(true)
    try {
      await printJewelryBarcodeLabels(labels)
    } finally {
      setPrinting(false)
    }
  }

  const toggleProduct = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectVisible = () => {
    setSelectedIds(new Set(filteredPrintProducts.map((item) => item.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barkod Sistemi"
        description="Telefon kamerası ile ürün okutun, sorgulayın ve takı şerit etiketi yazdırın."
      />

      <PageSubNav
        items={[
          { id: 'lookup', label: 'Sorgula / Okut' },
          { id: 'print', label: 'Barkod Yazdır' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as BarcodeTab)}
      />

      {activeTab === 'lookup' && (
        <>
          <Card title="Ürün Okut">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-white px-6 py-8 text-center transition hover:border-amber-400 hover:from-amber-100/80 hover:shadow-md"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg transition group-hover:scale-105">
                  <ScanIcon />
                </span>
                <span>
                  <span className="block text-lg font-bold text-slate-900">Ürün Okut</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Telefon kamerası ile barkod tarayın
                  </span>
                </span>
              </button>

              <form onSubmit={handleSearch} className="flex h-full flex-col justify-center gap-3">
                <Input
                  label="Barkod numarası"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Barkod okutun veya elle yazın"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={searching || !barcode.trim()}>
                    {searching ? 'Aranıyor...' : 'Sorgula'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="lg:hidden"
                    onClick={() => setScannerOpen(true)}
                  >
                    Kamera Aç
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {error && <p className="alert-error">{error}</p>}

          {product && (
            <Card title="Ürün Bilgisi">
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{product.name}</p>
                    <p className="mt-1 text-slate-600">
                      {product.karat} ayar · {product.weight_gram} gr · Stok: {product.stock_quantity}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-brand-700">
                      {formatPanelMoney(Number(product.sale_price))}
                    </p>
                  </div>
                  {product.barcode && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={printing}
                      onClick={() => void handlePrintProduct(product)}
                    >
                      <PrintIcon />
                      <span className="ml-2">Şerit Yazdır</span>
                    </Button>
                  )}
                </div>

                {product.barcode && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <ProductBarcode value={product.barcode} size="md" showValue />
                    <p className="mt-1 font-mono text-xs text-slate-500">{product.barcode}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'print' && (
        <Card title="Barkod Etiketi Yazdır">
          {productsLoading && <LoadingState label="Ürünler yükleniyor..." />}

          {!productsLoading && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                İnce uzun şerit formatında yazdırılır (12×82 mm). Takıdan geçirip üst ve alt
                yapışkan uçları arkada birleştirin.
              </p>

              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1 sm:min-w-[12rem]">
                  <Input
                    label="Ürün ara"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Ürün adı veya barkod"
                  />
                </div>
                <div className="w-28">
                  <Input
                    label="Kopya"
                    type="number"
                    min="1"
                    max="20"
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={selectVisible}>
                  Görünenleri Seç
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={clearSelection}>
                  Seçimi Temizle
                </Button>
                <Button
                  type="button"
                  disabled={printing || selectedIds.size === 0}
                  onClick={() => void handlePrintSelected()}
                >
                  {printing ? 'Yazdırılıyor...' : `Seçilenleri Yazdır (${selectedIds.size})`}
                </Button>
              </div>

              {printableProducts.length === 0 ? (
                <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Barkodu olan ürün bulunamadı. Önce ürün ekleyin; barkod otomatik oluşturulur.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {filteredPrintProducts.map((item) => {
                    const checked = selectedIds.has(item.id)

                    return (
                      <li key={item.id}>
                        <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduct(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {item.karat} ayar · {item.weight_gram} gr · {item.barcode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-brand-700">
                              {formatJewelryMoney(item.sale_price)}
                            </p>
                            <button
                              type="button"
                              className="mt-1 text-xs font-medium text-slate-500 underline-offset-2 hover:text-brand-700 hover:underline"
                              onClick={(event) => {
                                event.preventDefault()
                                void handlePrintProduct(item)
                              }}
                            >
                              Tek yazdır
                            </button>
                          </div>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}

              {printableProducts.length > 0 && filteredPrintProducts.length === 0 && (
                <p className="text-center text-sm text-slate-500">Arama sonucu bulunamadı.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {scannerOpen && (
        <BarcodeScannerModal
          onScan={(code) => void handleScan(code)}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
