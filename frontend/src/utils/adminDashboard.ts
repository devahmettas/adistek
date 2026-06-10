import axios from 'axios'
import type { RestaurantListItem } from '../api/types'

export interface AdminDashboardStats {
  restaurantCount: number
  categoryCount: number
  productCount: number
  tableCount: number
}

export function computeAdminDashboardStats(restaurants: RestaurantListItem[]): AdminDashboardStats {
  return restaurants.reduce(
    (stats, restaurant) => ({
      restaurantCount: stats.restaurantCount + 1,
      categoryCount: stats.categoryCount + restaurant.categories_count,
      productCount: stats.productCount + restaurant.products_count,
      tableCount: stats.tableCount + restaurant.tables_count,
    }),
    {
      restaurantCount: 0,
      categoryCount: 0,
      productCount: 0,
      tableCount: 0,
    },
  )
}

export function displayAdminValue(value: string | null | undefined): string {
  return value?.trim() ? value : '—'
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error) || !error.response?.data) {
    return fallback
  }

  const data = error.response.data as {
    message?: string
    errors?: Record<string, string[]>
  }
  if (data.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (firstError) {
      return firstError
    }
  }

  if (data.message) {
    return data.message
  }

  return fallback
}
