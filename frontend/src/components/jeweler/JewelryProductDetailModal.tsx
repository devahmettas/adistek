import Button from '../Button'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import type { JewelryProduct } from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface JewelryProductDetailModalProps {
  product: JewelryProduct
  categoryName?: string | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function JewelryProductDetailModal({
  product,
  categoryName,
  onClose,
  onEdit,
  onDelete,
}: JewelryProductDetailModalProps) {
  useBodyScrollLock(true)

  const previewUrl = resolveMenuAssetUrl(null, product.image_path)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[min(92vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:flex-row"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/50 p-6 sm:p-8 lg:max-w-[48%]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-base text-slate-400">
              Fotoğraf yok
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:max-w-[52%]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Ürün Detayı
              </p>
              <h2 id="product-detail-title" className="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                {categoryName ?? 'Kategorisiz'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-800">
                {product.karat} ayar
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 lg:flex"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-6 py-5 sm:gap-6 sm:px-8 sm:py-6">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
              <p className="text-sm font-medium text-slate-500">Satış Fiyatı</p>
              <p className="mt-1 text-3xl font-bold text-brand-700 sm:text-4xl">
                {formatJewelryMoney(product.sale_price)}
                {product.is_manual_price && (
                  <span className="ml-2 text-sm font-normal text-slate-500">(Manuel)</span>
                )}
              </p>
            </div>

            <dl className="grid shrink-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {[
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
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-1 text-base font-semibold text-slate-900 sm:text-lg ${
                      item.mono ? 'font-mono text-sm sm:text-base' : ''
                    }`}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <h3 className="shrink-0 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Açıklama
              </h3>
              {product.description ? (
                <p className="mt-3 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-base leading-relaxed text-slate-600">
                  {product.description}
                </p>
              ) : (
                <p className="mt-3 text-base text-slate-400">Açıklama eklenmemiş.</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 px-6 py-4 sm:px-8">
            <Button type="button" onClick={onEdit}>
              Düzenle
            </Button>
            <Button type="button" variant="secondary" onClick={onDelete}>
              Sil
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
