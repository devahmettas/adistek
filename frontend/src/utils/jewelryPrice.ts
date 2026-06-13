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
  totalProfit: number
  profitMarginPercent: number
  catalogPrice: number
  priceDifference: number
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
): JewelrySaleProfitSummary {
  const goldPricePerGram = getGoldPricePerGram(karat, prices)
  const metalValue = goldPricePerGram !== null
    ? Math.round(weightGram * goldPricePerGram * 100) / 100
    : 0
  const labor = Number(laborCost) || 0
  const unitCost = Math.round((metalValue + labor) * 100) / 100
  const qty = Math.max(1, quantity)
  const subtotal = Math.round(unitSalePrice * qty * 100) / 100
  const discountValue = Math.max(0, discount)
  const totalRevenue = Math.round(Math.max(0, subtotal - discountValue) * 100) / 100
  const totalCost = Math.round(unitCost * qty * 100) / 100
  const totalProfit = Math.round((totalRevenue - totalCost) * 100) / 100
  const unitProfit = Math.round((unitSalePrice - unitCost) * 100) / 100
  const profitMarginPercent = totalRevenue > 0
    ? Math.round((totalProfit / totalRevenue) * 10000) / 100
    : 0
  const priceDifference = Math.round((unitSalePrice - catalogPrice) * 100) / 100

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
    totalProfit,
    profitMarginPercent,
    catalogPrice,
    priceDifference,
  }
}

export interface JewelryCartTotals {
  subtotal: number
  discount: number
  totalRevenue: number
  totalCost: number
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
  }>,
  discount: number,
  prices: MarketGoldPriceRecord[],
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
    )
    subtotal += lineProfit.subtotal
    totalCost += lineProfit.totalCost
  }

  const discountValue = Math.max(0, discount)
  const totalRevenue = Math.round(Math.max(0, subtotal - discountValue) * 100) / 100
  const totalProfit = Math.round((totalRevenue - totalCost) * 100) / 100
  const profitMarginPercent = totalRevenue > 0
    ? Math.round((totalProfit / totalRevenue) * 10000) / 100
    : 0

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: discountValue,
    totalRevenue,
    totalCost: Math.round(totalCost * 100) / 100,
    totalProfit,
    profitMarginPercent,
  }
}
