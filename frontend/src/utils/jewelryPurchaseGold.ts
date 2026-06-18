import type { MarketGoldPriceRecord, MarketGoldPriceType } from '../api/jeweler'
import {
  getMarketGoldPiecePrice,
  getMarketSellPricePerGram,
  getSuggestedBuyPricePerGram,
} from './jewelryPrice'
import { parseMoneyInput } from './moneyInput'

export { getMarketGoldPiecePrice } from './jewelryPrice'

export type PurchasePricingMode = 'gram' | 'piece'

export interface GoldPurchaseQuickType {
  key: string
  label: string
  categoryName: string
  goldType: MarketGoldPriceType
  pricingMode: PurchasePricingMode
  karat: number
  defaultDescription: string
}

export const GOLD_PURCHASE_QUICK_TYPES: GoldPurchaseQuickType[] = [
  {
    key: 'gram',
    label: 'Gram',
    categoryName: 'Gram Altın',
    goldType: 'gram_altin',
    pricingMode: 'gram',
    karat: 24,
    defaultDescription: 'Gram Altın',
  },
  {
    key: 'ceyrek',
    label: 'Çeyrek',
    categoryName: 'Çeyrek Altın',
    goldType: 'ceyrek_altin',
    pricingMode: 'piece',
    karat: 22,
    defaultDescription: 'Çeyrek Altın',
  },
  {
    key: 'yarim',
    label: 'Yarım',
    categoryName: 'Yarım Altın',
    goldType: 'yarim_altin',
    pricingMode: 'piece',
    karat: 22,
    defaultDescription: 'Yarım Altın',
  },
  {
    key: 'tam',
    label: 'Tam',
    categoryName: 'Tam Altın',
    goldType: 'tam_altin',
    pricingMode: 'piece',
    karat: 22,
    defaultDescription: 'Tam Altın',
  },
  {
    key: 'ata',
    label: 'Ata',
    categoryName: 'Ata Altın',
    goldType: 'cumhuriyet_altini',
    pricingMode: 'piece',
    karat: 22,
    defaultDescription: 'Ata Altın',
  },
  {
    key: 'cumhuriyet',
    label: 'Cumhuriyet',
    categoryName: 'Cumhuriyet Altını',
    goldType: 'cumhuriyet_altini',
    pricingMode: 'piece',
    karat: 22,
    defaultDescription: 'Cumhuriyet Altını',
  },
]

export const GOLD_PURCHASE_CATEGORY_NAMES = GOLD_PURCHASE_QUICK_TYPES.map((type) => type.categoryName)

export interface PurchaseFormItem {
  key: string
  item_description: string
  karat: string
  weight_gram: string
  unit_price: string
  quantity: string
  product_id: string
  category_id: string
  gold_type: MarketGoldPriceType | ''
  pricing_mode: PurchasePricingMode
}

export function createEmptyPurchaseItem(): PurchaseFormItem {
  return {
    key: crypto.randomUUID(),
    item_description: '',
    karat: '22',
    weight_gram: '',
    unit_price: '',
    quantity: '1',
    product_id: '',
    category_id: '',
    gold_type: '',
    pricing_mode: 'gram',
  }
}

export function createQuickGoldItem(
  quickType: GoldPurchaseQuickType,
  categoryId = '',
): PurchaseFormItem {
  return {
    key: crypto.randomUUID(),
    item_description: quickType.defaultDescription,
    karat: String(quickType.karat),
    weight_gram: '0',
    unit_price: '',
    quantity: '1',
    product_id: '',
    category_id: categoryId,
    gold_type: quickType.goldType,
    pricing_mode: quickType.pricingMode,
  }
}

export function calculatePurchaseLinePaid(item: PurchaseFormItem): number {
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const unitPrice = parseMoneyInput(item.unit_price) || 0

  if (item.pricing_mode === 'piece') {
    return Math.round(unitPrice * quantity * 100) / 100
  }

  return Math.round(unitPrice * 100) / 100
}

export function getPurchaseApiUnitPrice(item: PurchaseFormItem): number {
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const paid = calculatePurchaseLinePaid(item)

  if (item.pricing_mode === 'piece') {
    return parseMoneyInput(item.unit_price) || 0
  }

  const weight = Number(item.weight_gram) || 0
  if (weight > 0) {
    return Math.round((paid / (weight * quantity)) * 100) / 100
  }

  return Math.round((paid / quantity) * 100) / 100
}

export function getPurchaseGramWeight(item: PurchaseFormItem): number {
  if (item.pricing_mode !== 'gram') {
    return 0
  }

  const enteredWeight = Number(item.weight_gram) || 0
  if (enteredWeight > 0) {
    return enteredWeight
  }

  return Math.max(1, Number(item.quantity) || 1)
}

export function getPurchaseUnitMarketPrice(
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

export function calculatePurchaseLineMarketValue(
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

  if (item.pricing_mode === 'gram') {
    const weight = Number(item.weight_gram) || 0

    if (!item.gold_type && weight > 0) {
      const sellPrice = getMarketSellPricePerGram(Number(item.karat) || 22, goldPrices)
      if (sellPrice === null) {
        return 0
      }

      return Math.round(weight * sellPrice * quantity * 100) / 100
    }

    if (item.gold_type) {
      const piecePrice = getMarketGoldPiecePrice(item.gold_type, goldPrices)
      if (piecePrice !== null) {
        return Math.round(piecePrice * quantity * 100) / 100
      }

      const sellPrice = getMarketSellPricePerGram(Number(item.karat) || 22, goldPrices)
      if (sellPrice === null) {
        return 0
      }

      return Math.round(sellPrice * quantity * 100) / 100
    }

    return 0
  }

  return 0
}

export function calculatePurchaseProfitSummary(
  items: PurchaseFormItem[],
  goldPrices: MarketGoldPriceRecord[],
) {
  const validItems = items.filter((item) => item.item_description.trim())
  const totalPaid = validItems.reduce((sum, item) => sum + calculatePurchaseLinePaid(item), 0)
  const marketValue = validItems.reduce(
    (sum, item) => sum + calculatePurchaseLineMarketValue(item, goldPrices),
    0,
  )
  const savings = Math.round((marketValue - totalPaid) * 100) / 100
  const savingsPercent = marketValue > 0
    ? Math.round((savings / marketValue) * 10000) / 100
    : 0

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    marketValue: Math.round(marketValue * 100) / 100,
    savings,
    savingsPercent,
  }
}

export function getSuggestedPurchaseUnitPrice(
  item: Pick<PurchaseFormItem, 'pricing_mode' | 'gold_type' | 'karat'>,
  goldPrices: MarketGoldPriceRecord[],
): number | null {
  if (item.pricing_mode === 'piece' && item.gold_type) {
    const piecePrice = getMarketGoldPiecePrice(item.gold_type, goldPrices)
    if (piecePrice === null) {
      return null
    }

    return Math.round(piecePrice * 0.97 * 100) / 100
  }

  return getSuggestedBuyPricePerGram(Number(item.karat) || 22, goldPrices)
}

export function getSuggestedPurchaseLineTotal(
  item: Pick<PurchaseFormItem, 'pricing_mode' | 'gold_type' | 'karat' | 'weight_gram' | 'quantity'>,
  goldPrices: MarketGoldPriceRecord[],
): number | null {
  const quantity = Math.max(1, Number(item.quantity) || 1)

  if (item.pricing_mode === 'piece' && item.gold_type) {
    const unitPrice = getSuggestedPurchaseUnitPrice(item, goldPrices)
    if (unitPrice === null) {
      return null
    }

    return Math.round(unitPrice * quantity * 100) / 100
  }

  if (item.pricing_mode === 'gram') {
    const weight = Number(item.weight_gram) || 0

    if (!item.gold_type && weight > 0) {
      const perGram = getSuggestedBuyPricePerGram(Number(item.karat) || 22, goldPrices)
      if (perGram === null) {
        return null
      }

      return Math.round(weight * perGram * quantity * 100) / 100
    }

    if (item.gold_type) {
      const piecePrice = getMarketGoldPiecePrice(item.gold_type, goldPrices)
      if (piecePrice !== null) {
        return Math.round(piecePrice * 0.97 * quantity * 100) / 100
      }

      const perGram = getSuggestedBuyPricePerGram(Number(item.karat) || 22, goldPrices)
      if (perGram === null) {
        return null
      }

      return Math.round(perGram * quantity * 100) / 100
    }

    return null
  }

  return null
}
