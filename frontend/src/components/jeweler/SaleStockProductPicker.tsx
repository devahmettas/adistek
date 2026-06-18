import { useEffect, useMemo, useState } from 'react'
import Input from '../Input'
import type { JewelryCategory, JewelryProduct } from '../../api/jeweler'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import { getAvailableProductStock, isJewelryStockProduct } from '../../utils/jewelrySaleGold'
import type { SaleFormItem } from '../../utils/jewelrySaleGold'

type CategoryFilter = number | 'uncategorized' | null

interface CategoryGroup {
  key: CategoryFilter
  name: string
  count: number
  products: JewelryProduct[]
}

interface SaleStockProductPickerProps {
  products: JewelryProduct[]
  categories: JewelryCategory[]
  saleItems: SaleFormItem[]
  externalSearchQuery?: string
  extraStockByProductId?: Map<number, number>
  compact?: boolean
  onSelect: (product: JewelryProduct) => void
}

export default function SaleStockProductPicker({
  products,
  categories,
  saleItems,
  externalSearchQuery = '',
  extraStockByProductId,
  compact = false,
  onSelect,
}: SaleStockProductPickerProps) {
  const [search, setSearch] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<CategoryFilter>(null)

  const activeSearch = externalSearchQuery.trim() || search.trim()

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const jewelryProducts = useMemo(() => (
    products
      .filter((product) => isJewelryStockProduct(product, categories))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  ), [products, categories])

  const categoryGroups = useMemo(() => {
    const map = new Map<CategoryFilter, CategoryGroup>()

    for (const product of jewelryProducts) {
      const key: CategoryFilter = product.category_id ?? 'uncategorized'
      const name = product.category_id
        ? categoryNameById.get(product.category_id) ?? 'Diğer'
        : 'Kategorisiz'

      const existing = map.get(key)
      if (existing) {
        existing.count += product.stock_quantity
        existing.products.push(product)
      } else {
        map.set(key, {
          key,
          name,
          count: product.stock_quantity,
          products: [product],
        })
      }
    }

    return [...map.values()]
      .map((group) => ({
        ...group,
        count: group.products.reduce((sum, product) => sum + product.stock_quantity, 0),
        products: group.products.sort((a, b) => a.name.localeCompare(b.name, 'tr')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [jewelryProducts, categoryNameById])

  const filteredGroups = useMemo(() => {
    const query = activeSearch.toLowerCase()

    const baseGroups = !query
      ? categoryGroups
      : categoryGroups
        .map((group) => ({
          ...group,
          products: group.products.filter((product) => {
            const categoryName = product.category_id
              ? categoryNameById.get(product.category_id) ?? ''
              : ''

            return product.name.toLowerCase().includes(query)
              || product.barcode?.toLowerCase().includes(query)
              || categoryName.toLowerCase().includes(query)
          }),
        }))
        .filter((group) => group.products.length > 0)
        .map((group) => ({
          ...group,
          count: group.products.reduce((sum, product) => sum + product.stock_quantity, 0),
        }))

    return baseGroups
  }, [categoryGroups, activeSearch, categoryNameById])

  useEffect(() => {
    if (activeSearch && filteredGroups.length > 0) {
      setExpandedCategory(filteredGroups[0].key)
    }
  }, [activeSearch, filteredGroups])

  const activeGroup = filteredGroups.find((group) => group.key === expandedCategory) ?? null

  const visibleProducts = useMemo(() => {
    if (!activeGroup) {
      return []
    }

    return activeGroup.products
  }, [activeGroup])

  const toggleCategory = (key: CategoryFilter) => {
    setExpandedCategory((current) => (current === key ? null : key))
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className={`flex flex-col gap-2 ${compact ? '' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        <div>
          <p className={`font-semibold text-slate-800 ${compact ? 'text-xs uppercase tracking-wide text-slate-500' : 'text-sm'}`}>
            Stoktaki Ürünler
          </p>
          {!compact && (
            <p className="text-xs text-slate-500">Bilezik, kolye ve diğer takı ürünlerini kategoriden seçin.</p>
          )}
        </div>
        {!compact && !externalSearchQuery.trim() && (
          <Input
            label="Ara"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün adı, barkod..."
            className="sm:max-w-xs"
          />
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center text-sm text-slate-500">
          {activeSearch
            ? 'Aramanıza uygun stok ürünü bulunamadı.'
            : 'Stokta satılabilir takı ürünü yok. Ürün Yönetimi\'nden ürün ekleyin.'}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {filteredGroups.map((group) => {
              const isActive = expandedCategory === group.key
              const availableCount = group.products.reduce(
                (sum, product) => sum + getAvailableProductStock(
                  product,
                  saleItems,
                  undefined,
                  extraStockByProductId?.get(product.id) ?? 0,
                ),
                0,
              )

              return (
                <button
                  key={String(group.key)}
                  type="button"
                  onClick={() => toggleCategory(group.key)}
                  className={`rounded-full font-medium transition ${
                    compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                  } ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {group.name}
                  <span className={`ml-1 ${isActive ? 'text-brand-100' : 'text-slate-500'}`}>
                    ({availableCount})
                  </span>
                </button>
              )
            })}
          </div>

          {!activeGroup ? (
            <p className={`rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-center text-slate-500 ${
              compact ? 'px-3 py-3 text-xs' : 'rounded-xl px-4 py-5 text-sm'
            }`}>
              Ürünleri görmek için bir kategori seçin.
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className={`rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-center text-slate-500 ${
              compact ? 'px-3 py-3 text-xs' : 'rounded-xl px-4 py-5 text-sm'
            }`}>
              Bu kategoride ürün bulunamadı.
            </p>
          ) : (
            <div className={`grid gap-2 ${
              compact
                ? 'max-h-[200px] overflow-y-auto sm:grid-cols-2 md:max-h-[240px] lg:max-h-[280px]'
                : 'sm:grid-cols-2 xl:grid-cols-3'
            }`}>
              {visibleProducts.map((product) => {
                const previewUrl = resolveMenuAssetUrl(null, product.image_path)
                const available = getAvailableProductStock(
                  product,
                  saleItems,
                  undefined,
                  extraStockByProductId?.get(product.id) ?? 0,
                )
                const inSale = available < product.stock_quantity

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={available < 1}
                    onClick={() => onSelect(product)}
                    className={`flex overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-brand-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                      compact ? '' : 'rounded-2xl shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/40 p-1.5 ${
                      compact ? 'h-14 w-14' : 'h-24 w-24 p-2'
                    }`}>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-400">Foto yok</span>
                      )}
                    </div>
                    <div className={`min-w-0 flex-1 ${compact ? 'p-2' : 'p-3'}`}>
                      <p className={`truncate font-semibold text-slate-900 ${compact ? 'text-xs' : ''}`}>
                        {product.name}
                      </p>
                      <p className={`truncate text-slate-500 ${compact ? 'text-[10px]' : 'mt-0.5 text-xs'}`}>
                        {product.karat ? `${product.karat} ayar` : ''}
                        {product.weight_gram ? ` · ${product.weight_gram} gr` : ''}
                      </p>
                      <div className={`flex flex-wrap items-center gap-1 ${compact ? 'mt-1' : 'mt-2 gap-2'}`}>
                        <span className={`font-bold text-brand-700 ${compact ? 'text-xs' : 'text-sm'}`}>
                          {formatJewelryMoney(Number(product.sale_price))}
                        </span>
                        <span className={`rounded-full font-medium ${
                          compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                        } ${
                          available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {available > 0 ? `${available}` : 'Yok'}
                        </span>
                        {inSale && available > 0 && (
                          <span className={`rounded-full bg-brand-50 font-medium text-brand-700 ${
                            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                          }`}>
                            Listede
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
