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

export interface StatsWaiterRow {
  waiter_id: number | null
  waiter_name: string
  table_sessions: number
  revenue: number
  items_sold: number
  average_bill: number
  revenue_share: number
}

export interface StatsWaiterPerformance {
  top_waiter: StatsWaiterRow | null
  waiters: StatsWaiterRow[]
}

export interface StatsTableDensitySummary {
  total_tables: number
  sessions_today: number
  average_sessions_per_table: number
  turnover_rate: number
  current_occupancy_rate: number
  current_active_tables: number
  peak_hour: string | null
  peak_hour_sessions: number
}

export interface StatsTableDensityRow {
  table_id: number | null
  table_name: string
  sessions: number
  revenue: number
  average_bill: number
  session_share: number
  revenue_share: number
}

export interface StatsHourlyOccupancy {
  hour: number
  label: string
  sessions: number
  occupancy_rate: number
}

export interface StatsTableDensity {
  summary: StatsTableDensitySummary
  tables: StatsTableDensityRow[]
  hourly_occupancy: StatsHourlyOccupancy[]
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
  waiter_performance: StatsWaiterPerformance
  table_density: StatsTableDensity
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
