export interface Restaurant {
  id: number
  name: string
  email: string
  created_at: string
}

export interface Category {
  id: number
  restaurant_id: number
  name: string
  created_at: string
}

export interface Product {
  id: number
  restaurant_id: number
  category_id: number
  name: string
  price: string
  description: string | null
  is_active: boolean
  created_at: string
  category?: Category
  pivot?: {
    quantity: number
    note: string | null
    created_at: string
  }
}

import type { TableStatus } from '../constants/tableStatuses'

export interface RestaurantTable {
  id: number
  restaurant_id: number
  name: string
  status: TableStatus
  occupied_at: string | null
  total_amount: string
  occupied_minutes: number | null
  created_at: string
  products?: Product[]
}

export interface ApiResponse<T> {
  data: T
}

export interface AuthResponse {
  token: string
  restaurant: Restaurant
}

export interface Admin {
  id: number
  name: string
  email: string
  is_admin: boolean
}

export interface AdminAuthResponse {
  token: string
  admin: Admin
}

export interface RestaurantListItem extends Restaurant {
  categories_count: number
  products_count: number
  tables_count: number
}
