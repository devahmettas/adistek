import apiClient from './client'
import type { ApiResponse } from './types'

export interface JewelryCategory {
  id: number
  restaurant_id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface JewelryProduct {
  id: number
  restaurant_id: number
  category_id: number | null
  name: string
  sku: string | null
  barcode: string | null
  metal_type: string
  karat: number | null
  weight_gram: string
  stone_type: string | null
  stone_carat: string | null
  purchase_price: string
  labor_cost: string
  profit_rate: string
  sale_price: string
  is_manual_price: boolean
  stock_quantity: number
  description: string | null
  image_path: string | null
  is_active: boolean
  created_at: string
  category?: JewelryCategory
}

export interface JewelryCustomer {
  id: number
  restaurant_id: number
  name: string
  phone: string | null
  email: string | null
  tc_identity: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface JewelrySaleItem {
  id: number
  sale_id: number
  product_id: number | null
  product_name: string
  quantity: number
  unit_price: string
  weight_gram: string | null
  labor_cost: string
  line_total: string
  product?: JewelryProduct
}

export interface JewelrySale {
  id: number
  restaurant_id: number
  customer_id: number | null
  sale_number: string
  subtotal: string
  discount: string
  total: string
  payment_method: string
  notes: string | null
  sold_at: string
  created_at: string
  customer?: JewelryCustomer
  items?: JewelrySaleItem[]
}

export interface JewelryRepair {
  id: number
  restaurant_id: number
  customer_id: number | null
  repair_number: string
  item_description: string
  metal_type: string | null
  karat: number | null
  status: string
  estimated_cost: string | null
  final_cost: string | null
  received_at: string
  estimated_delivery_at: string | null
  completed_at: string | null
  delivered_at: string | null
  notes: string | null
  created_at: string
  customer?: JewelryCustomer
}

export interface JewelryStockMovement {
  id: number
  restaurant_id: number
  product_id: number
  type: string
  quantity: number
  weight_gram: string | null
  notes: string | null
  created_at: string
  product?: JewelryProduct
}

export type MarketGoldPriceType =
  | 'ayar_22'
  | 'ayar_18'
  | 'ayar_14'
  | 'ayar_8'
  | 'gram_altin'
  | 'cumhuriyet_altini'
  | 'eski_ceyrek_altin'
  | 'ceyrek_altin'
  | 'eski_yarim_altin'
  | 'yarim_altin'
  | 'eski_ziynet'
  | 'tam_altin'
  | 'paketli_has'
  | 'ayar_24'

export interface MarketGoldPriceRecord {
  id: number
  provider: string
  type: MarketGoldPriceType
  external_key: string
  name: string
  cash_sell_price: string
  card_sell_price: string | null
  has_gold_base: string | null
  source: string | null
  fetched_at: string
  created_at: string
}

export interface MarketGoldPriceLatestResponse {
  prices: MarketGoldPriceRecord[]
  last_sync_at: string | null
  server_time: string
  timezone: string
  sync_interval_seconds: number
  provider: string
  source: string
  changed?: boolean
  stored_count?: number
  has_gold_base?: number | null
  version?: number
  stream_source?: string
  timed_out?: boolean
}

export interface MarketGoldPriceHistoryPoint {
  fetched_at: string
  cash_sell_price: number
  card_sell_price: number | null
  has_gold_base: number | null
}

export interface MarketGoldPriceHistoryResponse {
  type: MarketGoldPriceType
  label: string
  period: '24h' | '7d' | '30d'
  points: MarketGoldPriceHistoryPoint[]
}

export interface JewelrySettings {
  id: number
  restaurant_id: number
  default_karat: number
  tax_rate: string
  currency: string
  barcode_prefix: string | null
  company_name: string | null
  receipt_footer: string | null
  auto_generate_barcode: boolean
  created_at: string
}

export interface JewelerStats {
  summary: {
    today_revenue: number
    today_sales_count: number
    month_revenue: number
    month_sales_count: number
    average_sale: number
  }
  inventory: {
    total_products: number
    low_stock_count: number
  }
  repairs: {
    active_count: number
  }
  top_products: Array<{
    product_name: string
    quantity: number
    revenue: number
  }>
  payment_breakdown: Array<{
    payment_method: string
    total: number
    count: number
  }>
}

export async function getJewelerStats(): Promise<JewelerStats> {
  const { data } = await apiClient.get<ApiResponse<JewelerStats>>('/jeweler/stats')
  return data.data
}

export async function getJewelryCategories(): Promise<JewelryCategory[]> {
  const { data } = await apiClient.get<ApiResponse<JewelryCategory[]>>('/jeweler/categories')
  return data.data
}

export async function createJewelryCategory(payload: {
  name: string
  description?: string
}): Promise<JewelryCategory> {
  const { data } = await apiClient.post<ApiResponse<JewelryCategory>>('/jeweler/categories', payload)
  return data.data
}

export async function getJewelryProducts(): Promise<JewelryProduct[]> {
  const { data } = await apiClient.get<ApiResponse<JewelryProduct[]>>('/jeweler/products')
  return data.data
}

export interface JewelryPriceCalculation {
  gold_price_per_gram: number
  metal_value: number
  labor_cost: number
  profit_rate: number
  profit_amount: number
  sale_price: number
}

export async function calculateJewelryProductPrice(payload: {
  weight_gram: number | string
  karat: number
  labor_cost?: number | string
  profit_rate?: number | string
}): Promise<JewelryPriceCalculation> {
  const { data } = await apiClient.post<ApiResponse<JewelryPriceCalculation>>(
    '/jeweler/products/calculate-price',
    payload,
  )
  return data.data
}

export async function createJewelryProduct(
  payload: Partial<JewelryProduct> & { name: string },
): Promise<JewelryProduct> {
  const { data } = await apiClient.post<ApiResponse<JewelryProduct>>('/jeweler/products', payload)
  return data.data
}

export async function updateJewelryProduct(
  id: number,
  payload: Partial<JewelryProduct>,
): Promise<JewelryProduct> {
  const { data } = await apiClient.put<ApiResponse<JewelryProduct>>(`/jeweler/products/${id}`, payload)
  return data.data
}

export async function deleteJewelryProduct(id: number): Promise<void> {
  await apiClient.delete(`/jeweler/products/${id}`)
}

export async function lookupBarcode(barcode: string): Promise<JewelryProduct> {
  const { data } = await apiClient.get<ApiResponse<JewelryProduct>>(`/jeweler/barcode/${barcode}`)
  return data.data
}

export async function getJewelryCustomers(): Promise<JewelryCustomer[]> {
  const { data } = await apiClient.get<ApiResponse<JewelryCustomer[]>>('/jeweler/customers')
  return data.data
}

export async function createJewelryCustomer(
  payload: Partial<JewelryCustomer> & { name: string },
): Promise<JewelryCustomer> {
  const { data } = await apiClient.post<ApiResponse<JewelryCustomer>>('/jeweler/customers', payload)
  return data.data
}

export async function getJewelrySales(): Promise<JewelrySale[]> {
  const { data } = await apiClient.get<ApiResponse<JewelrySale[]>>('/jeweler/sales')
  return data.data
}

export async function getJewelryRepairs(): Promise<JewelryRepair[]> {
  const { data } = await apiClient.get<ApiResponse<JewelryRepair[]>>('/jeweler/repairs')
  return data.data
}

export async function createJewelryRepair(
  payload: Partial<JewelryRepair> & { item_description: string },
): Promise<JewelryRepair> {
  const { data } = await apiClient.post<ApiResponse<JewelryRepair>>('/jeweler/repairs', payload)
  return data.data
}

export async function updateJewelryRepair(
  id: number,
  payload: Partial<JewelryRepair>,
): Promise<JewelryRepair> {
  const { data } = await apiClient.put<ApiResponse<JewelryRepair>>(`/jeweler/repairs/${id}`, payload)
  return data.data
}

export async function getJewelryStockMovements(): Promise<JewelryStockMovement[]> {
  const { data } = await apiClient.get<ApiResponse<JewelryStockMovement[]>>('/jeweler/stock-movements')
  return data.data
}

export async function getMarketGoldPricesLatest(): Promise<MarketGoldPriceLatestResponse> {
  const { data } = await apiClient.get<ApiResponse<MarketGoldPriceLatestResponse>>('/jeweler/gold-prices/latest')
  return data.data
}

export async function getMarketGoldPricesLive(
  sinceVersion?: number,
): Promise<MarketGoldPriceLatestResponse> {
  const { data } = await apiClient.get<ApiResponse<MarketGoldPriceLatestResponse>>('/jeweler/gold-prices/live', {
    params: sinceVersion ? { since_version: sinceVersion } : undefined,
    timeout: 8000,
  })
  return data.data
}

export async function waitForMarketGoldPrices(
  sinceVersion: number,
  timeout = 25,
): Promise<MarketGoldPriceLatestResponse> {
  const { data } = await apiClient.get<ApiResponse<MarketGoldPriceLatestResponse>>('/jeweler/gold-prices/wait', {
    params: { since_version: sinceVersion, timeout },
    timeout: (timeout + 5) * 1000,
  })
  return data.data
}

export async function getMarketGoldPriceHistory(
  type: MarketGoldPriceType,
  period: '24h' | '7d' | '30d' = '24h',
): Promise<MarketGoldPriceHistoryResponse> {
  const { data } = await apiClient.get<ApiResponse<MarketGoldPriceHistoryResponse>>('/jeweler/gold-prices/history', {
    params: { type, period },
  })
  return data.data
}

export interface SyncMarketGoldPricesResponse {
  synced_count: number
  stored_count: number
  changed: boolean
  has_gold_base: number | null
  fetched_at: string
  provider: string
  source: string
  version: number
  prices: MarketGoldPriceRecord[]
}

export async function syncMarketGoldPrices(): Promise<SyncMarketGoldPricesResponse> {
  const { data } = await apiClient.post<ApiResponse<SyncMarketGoldPricesResponse>>(
    '/jeweler/gold-prices/sync',
    undefined,
    { timeout: 60_000 },
  )
  return data.data
}

export async function getJewelrySettings(): Promise<JewelrySettings> {
  const { data } = await apiClient.get<ApiResponse<JewelrySettings>>('/jeweler/settings')
  return data.data
}

export async function updateJewelrySettings(
  payload: Partial<JewelrySettings>,
): Promise<JewelrySettings> {
  const { data } = await apiClient.patch<ApiResponse<JewelrySettings>>('/jeweler/settings', payload)
  return data.data
}
