import { useEffect, useMemo, useRef, useState } from 'react'
import Input from '../Input'
import type { JewelryCategory, JewelryProduct } from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import { getAvailableProductStock } from '../../utils/jewelrySaleGold'
import type { SaleFormItem } from '../../utils/jewelrySaleGold'

interface SaleBarcodeSearchProps {
  products: JewelryProduct[]
  categories: JewelryCategory[]
  saleItems: SaleFormItem[]
  value: string
  onChange: (value: string) => void
  onSelect: (product: JewelryProduct) => void
  onBarcodeSubmit?: (code: string) => void
  toolbar?: boolean
}

export default function SaleBarcodeSearch({
  products,
  categories,
  saleItems,
  value,
  onChange,
  onSelect,
  onBarcodeSubmit,
  toolbar = false,
}: SaleBarcodeSearchProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) {
      return []
    }

    return products
      .filter((product) => product.is_active && product.stock_quantity > 0)
      .filter((product) => {
        const categoryName = product.category_id
          ? categoryNameById.get(product.category_id) ?? ''
          : ''

        return product.name.toLowerCase().includes(query)
          || product.barcode?.toLowerCase().includes(query)
          || product.sku?.toLowerCase().includes(query)
          || categoryName.toLowerCase().includes(query)
      })
      .slice(0, 8)
  }, [products, value, categoryNameById])

  const handleSubmit = () => {
    const query = value.trim()
    if (!query) {
      return
    }

    const exactBarcode = products.find(
      (product) => product.barcode?.toLowerCase() === query.toLowerCase(),
    )
    if (exactBarcode) {
      onSelect(exactBarcode)
      onChange('')
      return
    }

    const exactSku = products.find(
      (product) => product.sku?.toLowerCase() === query.toLowerCase(),
    )
    if (exactSku) {
      onSelect(exactSku)
      onChange('')
      return
    }

    if (matches.length === 1) {
      onSelect(matches[0])
      onChange('')
      return
    }

    onBarcodeSubmit?.(query)
  }

  useEffect(() => {
    const query = value.trim()
    if (!query || query.length < 3) {
      return
    }

    const exactMatch = products.find(
      (product) => product.barcode?.toLowerCase() === query.toLowerCase()
        || product.sku?.toLowerCase() === query.toLowerCase(),
    )

    if (!exactMatch) {
      return
    }

    const timer = window.setTimeout(() => {
      if (value.trim().toLowerCase() !== query.toLowerCase()) {
        return
      }

      onSelect(exactMatch)
      onChange('')
    }, 120)

    return () => window.clearTimeout(timer)
  }, [value, products, onSelect, onChange])

  useEffect(() => {
    setOpen(value.trim().length > 0 && matches.length > 0)
  }, [value, matches.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      {toolbar ? (
        <>
          <label htmlFor="sale-barcode-search" className="sr-only">
            Barkod / Ürün Ara
          </label>
          <input
            id="sale-barcode-search"
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmit()
              }
            }}
            onFocus={() => {
              if (value.trim() && matches.length > 0) {
                setOpen(true)
              }
            }}
            placeholder="Barkod veya ürün ara..."
            className="input-field h-[42px] w-full text-base md:text-sm"
            autoComplete="off"
          />
        </>
      ) : (
        <Input
          label="Barkod / Ürün Ara"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSubmit()
            }
          }}
          onFocus={() => {
            if (value.trim() && matches.length > 0) {
              setOpen(true)
            }
          }}
          placeholder="Barkod okutun veya ürün adı yazın..."
        />
      )}

      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((product) => {
            const categoryName = product.category_id
              ? categoryNameById.get(product.category_id)
              : null
            const available = getAvailableProductStock(product, saleItems)

            return (
              <li key={product.id}>
                <button
                  type="button"
                  disabled={available < 1}
                  onClick={() => {
                    onSelect(product)
                    onChange('')
                    setOpen(false)
                  }}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-semibold text-slate-900">{product.name}</span>
                  <span className="text-xs text-slate-500">
                    {product.barcode ? `Barkod: ${product.barcode}` : 'Barkodsuz'}
                    {categoryName ? ` · ${categoryName}` : ''}
                    {` · ${formatJewelryMoney(Number(product.sale_price))}`}
                  </span>
                  <span className={`text-[11px] font-medium ${available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {available > 0 ? `${available} adet stok` : 'Stok yok'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {value.trim() && matches.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">Eşleşen ürün bulunamadı.</p>
      )}
    </div>
  )
}
