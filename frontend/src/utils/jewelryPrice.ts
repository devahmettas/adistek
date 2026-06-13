import type { MarketGoldPriceRecord, MarketGoldPriceType } from '../api/jeweler'

export interface JewelryPriceBreakdown {
  goldPricePerGram: number
  metalValue: number
  laborCost: number
  profitRate: number
  profitAmount: number
  salePrice: number
}

const KARAT_TO_GOLD_TYPE: Record<number, MarketGoldPriceType> = {
  8: 'ayar_8',
  14: 'ayar_14',
  18: 'ayar_18',
  22: 'ayar_22',
  24: 'ayar_24',
}

const CATEGORY_TO_GOLD_TYPE: Record<string, MarketGoldPriceType> = {
  'Gram Altın': 'gram_altin',
  'Çeyrek Altın': 'ceyrek_altin',
  'Yarım Altın': 'yarim_altin',
  'Tam Altın': 'tam_altin',
  'Ata Altın': 'cumhuriyet_altini',
  'Cumhuriyet Altını': 'cumhuriyet_altini',
}

const PRODUCT_NAME_GOLD_TYPE_HINTS: Array<{ pattern: RegExp; type: MarketGoldPriceType }> = [
  { pattern: /çeyrek|ceyrek/i, type: 'ceyrek_altin' },
  { pattern: /yarım|yarim/i, type: 'yarim_altin' },
  { pattern: /cumhuriyet/i, type: 'cumhuriyet_altini' },
  { pattern: /\bata\b/i, type: 'cumhuriyet_altini' },
  { pattern: /tam\s*altın|tam\s*altin|\bziynet\b/i, type: 'tam_altin' },
  { pattern: /gram\s*altın|gram\s*altin/i, type: 'gram_altin' },
]

export interface ProductGoldContext {
  productName?: string
  categoryName?: string
  purchasePrice?: number
  unitCostOverride?: number
}

export interface ProductMetalMetrics {
  goldPricePerGram: number | null
  metalValue: number
  laborCost: number
  unitCost: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function getMarketGoldPiecePrice(
  goldType: MarketGoldPriceType,
  prices: MarketGoldPriceRecord[],
): number | null {
  const matched = prices.find((price) => price.type === goldType)
  if (!matched?.cash_sell_price) {
    return null
  }

  const value = Number(matched.cash_sell_price)
  return Number.isNaN(value) ? null : value
}

export function resolveGoldTypeFromProduct(
  productName?: string,
  categoryName?: string,
): MarketGoldPriceType | null {
  if (categoryName && CATEGORY_TO_GOLD_TYPE[categoryName]) {
    return CATEGORY_TO_GOLD_TYPE[categoryName]
  }

  const normalizedName = productName?.trim() ?? ''
  if (!normalizedName) {
    return null
  }

  for (const hint of PRODUCT_NAME_GOLD_TYPE_HINTS) {
    if (hint.pattern.test(normalizedName)) {
      return hint.type
    }
  }

  return null
}

export function resolveProductMetalMetrics(
  weightGram: number,
  karat: number,
  laborCost: number,
  prices: MarketGoldPriceRecord[],
  context?: ProductGoldContext,
): ProductMetalMetrics {
  const goldPricePerGram = getGoldPricePerGram(karat, prices)
  const weight = Number(weightGram) || 0
  const labor = Number(laborCost) || 0
  const purchasePrice = Number(context?.purchasePrice) || 0
  let metalValue = 0

  if (weight > 0 && goldPricePerGram !== null) {
    metalValue = roundMoney(weight * goldPricePerGram)
  } else {
    const goldType = resolveGoldTypeFromProduct(context?.productName, context?.categoryName)
    if (goldType) {
      const piecePrice = getMarketGoldPiecePrice(goldType, prices)
      if (piecePrice !== null) {
        metalValue = roundMoney(piecePrice)
      }
    }
  }

  if (metalValue <= 0 && purchasePrice > 0) {
    metalValue = roundMoney(purchasePrice)
  }

  const unitCost = context?.unitCostOverride !== undefined && context.unitCostOverride >= 0
    ? roundMoney(context.unitCostOverride)
    : purchasePrice > 0
      ? roundMoney(purchasePrice + labor)
      : roundMoney(metalValue + labor)

  return {
    goldPricePerGram,
    metalValue,
    laborCost: labor,
    unitCost,
  }
}

function getGoldPricePerGram(karat: number, prices: MarketGoldPriceRecord[]): number | null {
  const type = KARAT_TO_GOLD_TYPE[karat]
  const matched = type ? prices.find((price) => price.type === type) : null

  if (matched) {
    return Number(matched.cash_sell_price)
  }

  const hasGold = prices.find((price) => price.type === 'ayar_24')
  if (hasGold) {
    return Number(hasGold.cash_sell_price) * (karat / 24)
  }

  return null
}

export function calculateJewelryPrice(
  weightGram: number,
  karat: number,
  laborCost: number,
  profitRate: number,
  prices: MarketGoldPriceRecord[],
): JewelryPriceBreakdown | null {
  const goldPricePerGram = getGoldPricePerGram(karat, prices)

  if (goldPricePerGram === null || Number.isNaN(goldPricePerGram)) {
    return null
  }

  const metalValue = Math.round(weightGram * goldPricePerGram * 100) / 100
  const profitAmount = Math.round(metalValue * (profitRate / 100) * 100) / 100
  const salePrice = Math.round((metalValue + laborCost + profitAmount) * 100) / 100

  return {
    goldPricePerGram,
    metalValue,
    laborCost,
    profitRate,
    profitAmount,
    salePrice,
  }
}

export function formatJewelryMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return `${Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`
}

export const KARAT_OPTIONS = [
  { value: 8, label: '8 Ayar' },
  { value: 14, label: '14 Ayar' },
  { value: 18, label: '18 Ayar' },
  { value: 22, label: '22 Ayar' },
  { value: 24, label: '24 Ayar (Has)' },
]

export function getMarketSellPricePerGram(karat: number, prices: MarketGoldPriceRecord[]): number | null {
  return getGoldPricePerGram(karat, prices)
}

export function getSuggestedBuyPricePerGram(
  karat: number,
  prices: MarketGoldPriceRecord[],
  discountRate = 3,
): number | null {
  const sellPrice = getGoldPricePerGram(karat, prices)
  if (sellPrice === null || Number.isNaN(sellPrice)) {
    return null
  }

  return Math.round(sellPrice * (1 - discountRate / 100) * 100) / 100
}

export interface JewelrySaleFinancialSettings {
  card_commission_rate: number
  tax_rate: number
}

export interface JewelrySaleProfitSummary {
  goldPricePerGram: number | null
  metalValue: number
  laborCost: number
  unitCost: number
  unitSalePrice: number
  unitProfit: number
  quantity: number
  subtotal: number
  discount: number
  totalRevenue: number
  totalCost: number
  grossProfit: number
  cardCommission: number
  additionalTax: number
  netRevenue: number
  totalProfit: number
  profitMarginPercent: number
  catalogPrice: number
  priceDifference: number
}

function applySaleFinancialDeductions(
  totalRevenue: number,
  totalCost: number,
  paymentMethod: string,
  financialSettings?: JewelrySaleFinancialSettings,
) {
  const cardCommissionRate = Number(financialSettings?.card_commission_rate) || 0
  const taxRate = Number(financialSettings?.tax_rate) || 0
  const grossProfit = Math.round((totalRevenue - totalCost) * 100) / 100
  const cardCommission = paymentMethod === 'card'
    ? Math.round(totalRevenue * cardCommissionRate / 100 * 100) / 100
    : 0
  const additionalTax = Math.round(totalRevenue * taxRate / 100 * 100) / 100
  const netRevenue = Math.round((totalRevenue - cardCommission - additionalTax) * 100) / 100
  const totalProfit = Math.round((netRevenue - totalCost) * 100) / 100
  const profitMarginPercent = totalRevenue > 0
    ? Math.round((totalProfit / totalRevenue) * 10000) / 100
    : 0

  return {
    grossProfit,
    cardCommission,
    additionalTax,
    netRevenue,
    totalProfit,
    profitMarginPercent,
  }
}

export function calculateJewelrySaleProfit(
  unitSalePrice: number,
  weightGram: number,
  karat: number,
  laborCost: number,
  quantity: number,
  discount: number,
  catalogPrice: number,
  prices: MarketGoldPriceRecord[],
  paymentMethod = 'cash',
  financialSettings?: JewelrySaleFinancialSettings,
  context?: ProductGoldContext,
): JewelrySaleProfitSummary {
  const metrics = resolveProductMetalMetrics(
    weightGram,
    karat,
    laborCost,
    prices,
    context,
  )
  const { goldPricePerGram, metalValue, laborCost: labor } = metrics
  const unitCost = metrics.unitCost
  const qty = Math.max(1, quantity)
  const subtotal = Math.round(unitSalePrice * qty * 100) / 100
  const discountValue = Math.max(0, discount)
  const totalRevenue = Math.round(Math.max(0, subtotal - discountValue) * 100) / 100
  const totalCost = Math.round(unitCost * qty * 100) / 100
  const unitProfit = Math.round((unitSalePrice - unitCost) * 100) / 100
  const priceDifference = Math.round((unitSalePrice - catalogPrice) * 100) / 100
  const financials = applySaleFinancialDeductions(
    totalRevenue,
    totalCost,
    paymentMethod,
    financialSettings,
  )

  return {
    goldPricePerGram,
    metalValue,
    laborCost: labor,
    unitCost,
    unitSalePrice,
    unitProfit,
    quantity: qty,
    subtotal,
    discount: discountValue,
    totalRevenue,
    totalCost,
    ...financials,
    catalogPrice,
    priceDifference,
  }
}

export interface JewelryCartTotals {
  subtotal: number
  discount: number
  totalRevenue: number
  totalCost: number
  grossProfit: number
  cardCommission: number
  additionalTax: number
  netRevenue: number
  totalProfit: number
  profitMarginPercent: number
}

export function calculateJewelryCartTotals(
  lines: Array<{
    unit_price: number
    weight_gram: number
    karat: number
    labor_cost: number
    quantity: number
    catalog_price: number
    product_name?: string
    category_name?: string
    unit_cost_override?: number
  }>,
  discount: number,
  prices: MarketGoldPriceRecord[],
  paymentMethod = 'cash',
  financialSettings?: JewelrySaleFinancialSettings,
): JewelryCartTotals {
  let subtotal = 0
  let totalCost = 0

  for (const line of lines) {
    const lineProfit = calculateJewelrySaleProfit(
      line.unit_price,
      line.weight_gram,
      line.karat,
      line.labor_cost,
      line.quantity,
      0,
      line.catalog_price,
      prices,
      'cash',
      undefined,
      {
        productName: line.product_name,
        categoryName: line.category_name,
        unitCostOverride: line.unit_cost_override,
      },
    )
    subtotal += lineProfit.subtotal
    totalCost += lineProfit.totalCost
  }

  const discountValue = Math.max(0, discount)
  const totalRevenue = Math.round(Math.max(0, subtotal - discountValue) * 100) / 100
  const financials = applySaleFinancialDeductions(
    totalRevenue,
    Math.round(totalCost * 100) / 100,
    paymentMethod,
    financialSettings,
  )

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: discountValue,
    totalRevenue,
    totalCost: Math.round(totalCost * 100) / 100,
    ...financials,
  }
}
