import axios from 'axios'
import { isJewelerBusiness } from '../constants/businessType'
import type { RestaurantListItem } from '../api/types'

export interface AdminDashboardStats {
  businessCount: number
  restaurantCount: number
  jewelerCount: number
  categoryCount: number
  productCount: number
  tableCount: number
  jewelryProductCount: number
  jewelrySaleCount: number
  jewelryRepairCount: number
}

export function computeAdminDashboardStats(restaurants: RestaurantListItem[]): AdminDashboardStats {
  return restaurants.reduce(
    (stats, restaurant) => {
      const isJeweler = isJewelerBusiness(restaurant.business_type)

      return {
        businessCount: stats.businessCount + 1,
        restaurantCount: stats.restaurantCount + (isJeweler ? 0 : 1),
        jewelerCount: stats.jewelerCount + (isJeweler ? 1 : 0),
        categoryCount: stats.categoryCount + restaurant.categories_count,
        productCount: stats.productCount + restaurant.products_count,
        tableCount: stats.tableCount + restaurant.tables_count,
        jewelryProductCount: stats.jewelryProductCount + (restaurant.jewelry_products_count ?? 0),
        jewelrySaleCount: stats.jewelrySaleCount + (restaurant.jewelry_sales_count ?? 0),
        jewelryRepairCount: stats.jewelryRepairCount + (restaurant.jewelry_repairs_count ?? 0),
      }
    },
    {
      businessCount: 0,
      restaurantCount: 0,
      jewelerCount: 0,
      categoryCount: 0,
      productCount: 0,
      tableCount: 0,
      jewelryProductCount: 0,
      jewelrySaleCount: 0,
      jewelryRepairCount: 0,
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
