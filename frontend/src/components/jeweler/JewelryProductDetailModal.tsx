import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import type { JewelryProduct } from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface JewelryProductDetailModalProps {
  product: JewelryProduct
  categoryName?: string | null
  onClose: () => void
}

export default function JewelryProductDetailModal({
  product,
  categoryName,
  onClose,
}: JewelryProductDetailModalProps) {
  useBodyScrollLock(true)

  const previewUrl = resolveMenuAssetUrl(null, product.image_path)

  const specItems = [
    { label: 'Gram', value: `${product.weight_gram} gr` },
    { label: 'Stok', value: `${product.stock_quantity} adet` },
    { label: 'İşçilik', value: formatJewelryMoney(product.labor_cost) },
    { label: 'Kar Oranı', value: `%${product.profit_rate ?? '0'}` },
    { label: 'Metal', value: 'Altın' },
    ...(product.barcode
      ? [{ label: 'Barkod', value: product.barcode, mono: true }]
      : []),
    ...(product.sku
      ? [{ label: 'SKU', value: product.sku, mono: true }]
      : []),
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4 md:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(92vh,880px)] sm:rounded-3xl lg:flex-row"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <div className="relative flex h-[38vh] shrink-0 items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/50 p-4 sm:min-h-[280px] sm:flex-1 sm:p-6 md:p-8 lg:max-w-[48%]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 sm:text-base">
              Fotoğraf yok
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:max-w-[52%]">
          <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 sm:text-xs">
                  Ürün Detayı
                </p>
                <h2
                  id="product-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl"
                >
                  {product.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm md:text-base">
                  {categoryName ?? 'Kategorisiz'}
                </p>
                <p className="mt-1.5 text-sm font-medium text-brand-700">
                  {formatJewelryMoney(product.sale_price)}
                  {product.is_manual_price && (
                    <span className="ml-1 text-xs font-normal text-slate-500">(Manuel)</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 sm:px-4 sm:py-1.5 sm:text-sm">
                {product.karat} ayar
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4">
              {specItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-sm font-semibold text-slate-900 sm:mt-1 sm:text-base md:text-lg ${
                      item.mono ? 'break-all font-mono text-xs sm:text-sm' : ''
                    }`}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 sm:mt-5 sm:p-4 md:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700 sm:text-sm">
                Açıklama
              </h3>
              {product.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-base">
                  {product.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-400 sm:mt-3">Açıklama eklenmemiş.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
