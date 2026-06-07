import apiClient from './client'
import type { ApiResponse } from './types'

export interface StatsSummary {
  revenue: number
  table_sessions: number
  items_sold: number
  average_bill: number
}

export interface StatsLive {
  active_tables: number
  open_revenue: number
  total_tables: number
}

export interface StatsTopProduct {
  product_id: number | null
  product_name: string
  quantity: number
  revenue: number
}

export interface StatsTopCategory {
  category_name: string
  quantity: number
  revenue: number
}

export interface StatsHourlyRow {
  hour: number
  label: string
  revenue: number
  sessions: number
}

export interface StatsDayRow {
  date: string
  label: string
  revenue: number
  sessions: number
}

export interface RestaurantStats {
  date: string
  summary: StatsSummary
  live: StatsLive
  top_products: StatsTopProduct[]
  top_categories: StatsTopCategory[]
  hourly_revenue: StatsHourlyRow[]
  last_7_days: StatsDayRow[]
}

export const getRestaurantStats = async (date?: string): Promise<RestaurantStats> => {
  const { data } = await apiClient.get<ApiResponse<RestaurantStats>>('/stats', {
    params: date ? { date } : undefined,
  })
  return data.data
}
