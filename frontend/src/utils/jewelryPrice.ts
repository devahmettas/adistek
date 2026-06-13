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
