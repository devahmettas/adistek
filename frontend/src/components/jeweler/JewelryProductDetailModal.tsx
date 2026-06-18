import { useMemo } from 'react'
import Button from '../Button'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import { formatJewelryMoney, resolveProductMetalMetrics } from '../../utils/jewelryPrice'
import type { JewelryProduct, MarketGoldPriceRecord } from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import ProductBarcode from './ProductBarcode'
import { printJewelryBarcodeLabel, toJewelryBarcodeLabel } from '../../utils/jewelryBarcodePrint'

interface JewelryProductDetailModalProps {
  product: JewelryProduct
  categoryName?: string | null
  goldPrices: MarketGoldPriceRecord[]
  onClose: () => void
  onSell: () => void
}

export default function JewelryProductDetailModal({
  product,
  categoryName,
  goldPrices,
  onClose,
  onSell,
}: JewelryProductDetailModalProps) {
  useBodyScrollLock(true)

  const previewUrl = resolveMenuAssetUrl(product.image_url, product.image_path)
  const metrics = useMemo(
    () => resolveProductMetalMetrics(
      Number(product.weight_gram),
      product.karat ?? 22,
      Number(product.labor_cost),
      goldPrices,
      {
        productName: product.name,
        categoryName: categoryName ?? product.category?.name,
        purchasePrice: Number(product.purchase_price) || 0,
      },
    ),
    [product, categoryName, goldPrices],
  )

  const handlePrintLabel = () => {
    const label = toJewelryBarcodeLabel(product)
    if (!label) return
    void printJewelryBarcodeLabel(label)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden overscroll-behavior-contain bg-slate-900/50 p-0 lg:items-center lg:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-[100vw] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl lg:h-[min(88vh,700px)] lg:max-h-none lg:max-w-5xl lg:flex-row lg:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 lg:right-5 lg:top-5 lg:h-10 lg:w-10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto lg:flex lg:flex-row lg:overflow-hidden">
          <div className="relative flex aspect-[4/3] shrink-0 items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/40 p-5 sm:p-6 lg:aspect-auto lg:h-full lg:w-[44%] lg:border-r lg:border-slate-100 lg:p-8">
            <ProductBarcode value={product.barcode} size="sm" corner="top-right" />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain object-center"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 lg:h-full">
                Fotoğraf yok
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
            <div className="shrink-0 space-y-4 p-4 sm:p-6 lg:px-7 lg:pb-4 lg:pt-7">
              <div className="flex items-start justify-between gap-3 pr-10">
                <div className="min-w-0">
                  <h2 id="product-detail-title" className="text-xl font-bold text-slate-900 lg:text-2xl">
                    {product.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{categoryName ?? 'Kategorisiz'}</p>
                  <p className="mt-1.5 text-sm font-medium text-brand-700">
                    {formatJewelryMoney(product.sale_price)}
                    {product.is_manual_price && (
                      <span className="ml-1 text-xs font-normal text-slate-500">(Manuel)</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                  {product.karat} ayar
                </span>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm">
                <p className="font-semibold text-amber-900">Güncel Altın Değeri</p>
                {metrics.goldPricePerGram !== null && Number(product.weight_gram) > 0 ? (
                  <p className="mt-1 text-amber-800">
                    {product.karat} ayar · {formatJewelryMoney(metrics.goldPricePerGram)} / gr
                  </p>
                ) : null}
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-amber-700">Altın değeri</dt>
                    <dd className="font-semibold text-amber-900">{formatJewelryMoney(metrics.metalValue)}</dd>
                  </div>
                  <div>
                    <dt className="text-amber-700">Sıradaki satış maliyeti</dt>
                    <dd className="font-semibold text-amber-900">
                      {formatJewelryMoney(product.fifo_unit_cost ?? metrics.unitCost)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-amber-700">Ortalama alış</dt>
                    <dd className="font-semibold text-amber-900">
                      {formatJewelryMoney(product.average_unit_cost ?? product.purchase_price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-amber-700">Ortalama birim maliyet</dt>
                    <dd className="font-semibold text-amber-900">
                      {formatJewelryMoney(product.average_unit_cost_with_labor ?? metrics.unitCost)}
                    </dd>
                  </div>
                </dl>
              </div>

              <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm lg:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Gram</dt>
                  <dd className="font-medium text-slate-900">{product.weight_gram} gr</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Stok</dt>
                  <dd className="font-medium text-slate-900">{product.stock_quantity} adet</dd>
                </div>
                <div>
                  <dt className="text-slate-500">İşçilik</dt>
                  <dd className="font-medium text-slate-900">{formatJewelryMoney(product.labor_cost)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Alış fiyatı</dt>
                  <dd className="font-medium text-slate-900">{formatJewelryMoney(product.purchase_price)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Kar Oranı</dt>
                  <dd className="font-medium text-slate-900">%{product.profit_rate ?? '0'}</dd>
                </div>
                {product.barcode && (
                  <div className="col-span-2 lg:col-span-3">
                    <dt className="text-slate-500">Barkod</dt>
                    <dd className="mt-1 space-y-1">
                      <ProductBarcode value={product.barcode} size="sm" showValue />
                      <p className="break-all font-mono text-[10px] text-slate-500">{product.barcode}</p>
                    </dd>
                  </div>
                )}
                {product.sku && (
                  <div className="col-span-2 lg:col-span-1">
                    <dt className="text-slate-500">SKU</dt>
                    <dd className="font-mono text-xs font-medium text-slate-900 lg:text-sm">{product.sku}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-7">
              <h3 className="text-sm font-semibold text-slate-700">Açıklama</h3>
              {product.description ? (
                <p className="mt-2 whitespace-pre-wrap pb-4 text-sm leading-relaxed text-slate-600 lg:pb-2">
                  {product.description}
                </p>
              ) : (
                <p className="mt-2 pb-4 text-sm text-slate-400 lg:pb-2">Açıklama eklenmemiş.</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 p-4 lg:px-7 lg:py-5">
              <Button
                type="button"
                onClick={onSell}
                disabled={product.stock_quantity < 1}
              >
                Satış / Sepete Ekle
              </Button>
              {product.barcode && (
                <Button type="button" variant="secondary" onClick={handlePrintLabel}>
                  Şerit Yazdır
                </Button>
              )}
              <Button type="button" variant="secondary" className="lg:w-auto" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
