import type { JewelryCategory, JewelryProduct, MarketGoldPriceRecord } from '../api/jeweler'
import {
  getMarketGoldPiecePrice,
  getMarketSellPricePerGram,
} from './jewelryPrice'
import { formatMoneyInputFromNumber, parseMoneyInput } from './moneyInput'
import {
  createEmptyPurchaseItem,
  createQuickGoldItem,
  GOLD_PURCHASE_CATEGORY_NAMES,
  GOLD_PURCHASE_QUICK_TYPES,
  type GoldPurchaseQuickType,
  type PurchaseFormItem,
} from './jewelryPurchaseGold'

export {
  createEmptyPurchaseItem,
  createQuickGoldItem,
  GOLD_PURCHASE_QUICK_TYPES,
  type GoldPurchaseQuickType,
  type PurchaseFormItem as SaleFormItem,
}

export function calculateSaleLineTotal(item: PurchaseFormItem): number {
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const unitPrice = parseMoneyInput(item.unit_price) || 0

  if (item.pricing_mode === 'piece') {
    return Math.round(unitPrice * quantity * 100) / 100
  }

  const weight = Number(item.weight_gram) || 0
  return Math.round(weight * unitPrice * quantity * 100) / 100
}

export function getSaleUnitMarketPrice(
  item: Pick<PurchaseFormItem, 'pricing_mode' | 'gold_type' | 'karat'>,
  goldPrices: MarketGoldPriceRecord[],
): number | null {
  if (item.pricing_mode === 'piece' && item.gold_type) {
    return getMarketGoldPiecePrice(item.gold_type, goldPrices)
  }

  if (item.pricing_mode === 'gram') {
    return getMarketSellPricePerGram(Number(item.karat) || 22, goldPrices)
  }

  return null
}

export function calculateSaleLineMarketValue(
  item: PurchaseFormItem,
  goldPrices: MarketGoldPriceRecord[],
): number {
  const quantity = Math.max(1, Number(item.quantity) || 1)

  if (item.pricing_mode === 'piece' && item.gold_type) {
    const piecePrice = getMarketGoldPiecePrice(item.gold_type, goldPrices)
    if (piecePrice === null) {
      return 0
    }

    return Math.round(piecePrice * quantity * 100) / 100
  }

  const weight = Number(item.weight_gram) || 0
  const sellPrice = getMarketSellPricePerGram(Number(item.karat) || 22, goldPrices)
  if (sellPrice === null || weight <= 0) {
    return 0
  }

  return Math.round(weight * sellPrice * quantity * 100) / 100
}

export function calculateSaleSummary(
  items: PurchaseFormItem[],
  goldPrices: MarketGoldPriceRecord[],
) {
  const validItems = items.filter((item) => item.item_description.trim())
  const totalRevenue = validItems.reduce((sum, item) => sum + calculateSaleLineTotal(item), 0)
  const marketValue = validItems.reduce(
    (sum, item) => sum + calculateSaleLineMarketValue(item, goldPrices),
    0,
  )
  const difference = Math.round((totalRevenue - marketValue) * 100) / 100
  const differencePercent = marketValue > 0
    ? Math.round((difference / marketValue) * 10000) / 100
    : 0

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    marketValue: Math.round(marketValue * 100) / 100,
    difference,
    differencePercent,
  }
}

export function getSuggestedSaleUnitPrice(
  item: Pick<PurchaseFormItem, 'pricing_mode' | 'gold_type' | 'karat'>,
  goldPrices: MarketGoldPriceRecord[],
): number | null {
  return getSaleUnitMarketPrice(item, goldPrices)
}

export function createSaleItemFromProduct(product: JewelryProduct): PurchaseFormItem {
  return {
    key: crypto.randomUUID(),
    item_description: product.name,
    karat: String(product.karat ?? 22),
    weight_gram: String(product.weight_gram),
    unit_price: formatMoneyInputFromNumber(product.sale_price),
    quantity: '1',
    product_id: String(product.id),
    category_id: product.category_id ? String(product.category_id) : '',
    gold_type: '',
    pricing_mode: 'piece',
  }
}

export function getReservedProductQuantity(
  items: PurchaseFormItem[],
  productId: number,
  excludeKey?: string,
): number {
  return items
    .filter((item) => item.product_id === String(productId) && item.key !== excludeKey)
    .reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
}

export function getAvailableProductStock(
  product: JewelryProduct,
  items: PurchaseFormItem[],
  excludeKey?: string,
  extraStock = 0,
): number {
  return Math.max(
    0,
    product.stock_quantity + extraStock - getReservedProductQuantity(items, product.id, excludeKey),
  )
}

export function getProductsForQuickGoldType(
  quickType: GoldPurchaseQuickType,
  products: JewelryProduct[],
  categories: JewelryCategory[],
): JewelryProduct[] {
  const categoryId = categories.find((category) => category.name === quickType.categoryName)?.id

  return products.filter((product) => {
    if (!product.is_active || product.stock_quantity <= 0) {
      return false
    }

    if (categoryId && product.category_id === categoryId) {
      return true
    }

    const categoryName = product.category?.name
      ?? categories.find((category) => category.id === product.category_id)?.name

    return categoryName === quickType.categoryName
  })
}

export function getQuickGoldAvailableStock(
  quickType: GoldPurchaseQuickType,
  products: JewelryProduct[],
  categories: JewelryCategory[],
  saleItems: PurchaseFormItem[],
  extraStockByProductId?: Map<number, number>,
): number {
  return getProductsForQuickGoldType(quickType, products, categories)
    .reduce((sum, product) => {
      const extra = extraStockByProductId?.get(product.id) ?? 0
      return sum + getAvailableProductStock(product, saleItems, undefined, extra)
    }, 0)
}

export function pickProductForQuickGoldSale(
  quickType: GoldPurchaseQuickType,
  products: JewelryProduct[],
  categories: JewelryCategory[],
  saleItems: PurchaseFormItem[],
  requiredQuantity = 1,
): JewelryProduct | null {
  const candidates = getProductsForQuickGoldType(quickType, products, categories)
    .filter((product) => getAvailableProductStock(product, saleItems) >= requiredQuantity)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  return candidates[0] ?? null
}

export function getSaleItemMaxQuantity(
  item: PurchaseFormItem,
  products: JewelryProduct[],
  categories: JewelryCategory[],
  saleItems: PurchaseFormItem[],
  quickType?: GoldPurchaseQuickType | null,
  extraStockByProductId?: Map<number, number>,
): number | null {
  const excludeKey = item.key

  if (item.product_id) {
    const product = products.find((row) => row.id === Number(item.product_id))
    if (product) {
      const extra = extraStockByProductId?.get(product.id) ?? 0
      return getAvailableProductStock(product, saleItems, excludeKey, extra)
    }
  }

  const resolvedQuickType = quickType ?? GOLD_PURCHASE_QUICK_TYPES.find(
    (type) => type.goldType === item.gold_type && type.defaultDescription === item.item_description,
  )

  if (resolvedQuickType) {
    return getQuickGoldAvailableStock(
      resolvedQuickType,
      products,
      categories,
      saleItems.filter((row) => row.key !== excludeKey),
      extraStockByProductId,
    )
  }

  return null
}

export function buildExtraStockFromSaleItems(items: PurchaseFormItem[]): Map<number, number> {
  const map = new Map<number, number>()

  for (const item of items) {
    if (!item.product_id) {
      continue
    }

    const productId = Number(item.product_id)
    map.set(
      productId,
      (map.get(productId) ?? 0) + Math.max(1, Number(item.quantity) || 1),
    )
  }

  return map
}

export function isQuickGoldCategoryName(categoryName: string | null | undefined): boolean {
  if (!categoryName) {
    return false
  }

  return GOLD_PURCHASE_CATEGORY_NAMES.includes(categoryName)
}

export function isJewelryStockProduct(
  product: JewelryProduct,
  categories: JewelryCategory[],
): boolean {
  if (!product.is_active || product.stock_quantity <= 0) {
    return false
  }

  const categoryName = product.category?.name
    ?? (product.category_id
      ? categories.find((category) => category.id === product.category_id)?.name
      : null)

  return !isQuickGoldCategoryName(categoryName)
}
