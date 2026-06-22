import { Link, useSearchParams } from 'react-router-dom'
import JewelerPurchaseFormSection from '../../components/jeweler/JewelerPurchaseFormSection'
import JewelerSaleFormSection from '../../components/jeweler/JewelerSaleFormSection'
import PurchaseSaleModeToggle, { type PurchaseSaleMode } from '../../components/jeweler/PurchaseSaleModeToggle'
import SaleBarcodeScanButton from '../../components/jeweler/SaleBarcodeScanButton'
import SaleBarcodeSearch from '../../components/jeweler/SaleBarcodeSearch'
import PageHeader from '../../components/PageHeader'
import type { JewelryCategory, JewelryProduct } from '../../api/jeweler'
import type { SaleFormItem } from '../../utils/jewelrySaleGold'
import { useJewelerFeatures } from '../../hooks/useJewelerFeatures'
import { useState } from 'react'

function parseMode(value: string | null): PurchaseSaleMode {
  return value === 'sale' ? 'sale' : 'purchase'
}

export default function JewelerPurchasesPage() {
  const { barcodeEnabled } = useJewelerFeatures()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseMode(searchParams.get('mode'))
  const editParam = searchParams.get('edit')

  const setMode = (nextMode: PurchaseSaleMode) => {
    if (nextMode === 'purchase') {
      setSearchParams({}, { replace: true })
      setSaleScannerOpen(false)
      return
    }
    setSearchParams({ mode: 'sale' }, { replace: true })
  }

  const [saleScannerOpen, setSaleScannerOpen] = useState(false)
  const [saleBarcodeQuery, setSaleBarcodeQuery] = useState('')
  const [externalBarcodeCode, setExternalBarcodeCode] = useState<string | null>(null)
  const [saleCatalog, setSaleCatalog] = useState<{
    products: JewelryProduct[]
    categories: JewelryCategory[]
    saleItems: SaleFormItem[]
  } | null>(null)
  const [pendingSaleProductId, setPendingSaleProductId] = useState<number | null>(null)

  return (
    <div className="space-y-3 md:space-y-4">
      <PageHeader
        title="Ürün Alış Satış"
        actions={(
          <Link
            to={mode === 'sale' ? '/dashboard/jeweler/history' : '/dashboard/jeweler/history?tab=purchases'}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-800"
          >
            İşlem Geçmişi
          </Link>
        )}
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          <div className="w-full shrink-0 lg:w-auto">
            <PurchaseSaleModeToggle mode={mode} onChange={setMode} />
          </div>

          {mode === 'sale' && barcodeEnabled && (
            <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
              <SaleBarcodeScanButton
                variant="toolbar"
                onClick={() => setSaleScannerOpen(true)}
              />
              <SaleBarcodeSearch
                toolbar
                products={saleCatalog?.products ?? []}
                categories={saleCatalog?.categories ?? []}
                saleItems={saleCatalog?.saleItems ?? []}
                value={saleBarcodeQuery}
                onChange={setSaleBarcodeQuery}
                onSelect={(product) => setPendingSaleProductId(product.id)}
                onBarcodeSubmit={(code) => {
                  setExternalBarcodeCode(code)
                  setSaleBarcodeQuery('')
                }}
              />
            </div>
          )}
        </div>
      </div>

      {mode === 'sale' ? (
        <JewelerSaleFormSection
          barcodeEnabled={barcodeEnabled}
          scannerOpen={saleScannerOpen}
          onScannerOpenChange={setSaleScannerOpen}
          barcodeSearchQuery={saleBarcodeQuery}
          onBarcodeSearchQueryChange={setSaleBarcodeQuery}
          externalBarcodeCode={externalBarcodeCode}
          onExternalBarcodeHandled={() => setExternalBarcodeCode(null)}
          pendingProductId={pendingSaleProductId}
          onPendingProductHandled={() => setPendingSaleProductId(null)}
          editSaleId={editParam ? Number(editParam) : null}
          onEditSaleHandled={() => {
            setSearchParams((current) => {
              const next = new URLSearchParams(current)
              next.delete('edit')
              return next
            }, { replace: true })
          }}
          onCatalogLoaded={setSaleCatalog}
        />
      ) : (
        <JewelerPurchaseFormSection
          editPurchaseId={editParam ? Number(editParam) : null}
          onEditPurchaseHandled={() => {
            setSearchParams((current) => {
              const next = new URLSearchParams(current)
              next.delete('edit')
              return next
            }, { replace: true })
          }}
        />
      )}
    </div>
  )
}
