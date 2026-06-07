export interface Restaurant {
  id: number
  name: string
  slug?: string | null
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
    id: number
    quantity: number
    note: string | null
    kitchen_status?: 'pending' | 'ready' | 'acknowledged' | 'cancelled'
    ready_at?: string | null
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
  viewing_waiter_id: number | null
  viewing_waiter_at: string | null
  viewing_waiter_name?: string | null
  viewing_waiter?: Waiter | null
  assigned_waiter_id: number | null
  assigned_at: string | null
  assigned_waiter_name?: string | null
  assigned_waiter?: Waiter | null
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

export interface Waiter {
  id: number
  restaurant_id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
  restaurant?: Pick<Restaurant, 'id' | 'name'>
}

export interface WaiterAuthResponse {
  token: string
  waiter: Waiter
}

export interface KitchenStaff {
  id: number
  restaurant_id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
  restaurant?: Pick<Restaurant, 'id' | 'name'>
}

export interface KitchenAuthResponse {
  token: string
  kitchen_staff: KitchenStaff
}

export interface KitchenOrderItem {
  pivot_id: number
  product_name: string
  description: string | null
  quantity: number
  note: string | null
  kitchen_status: 'pending' | 'ready' | 'acknowledged' | 'cancelled'
  ready_at?: string | null
  created_at: string
}

export interface KitchenOrder {
  table_id: number
  table_name: string
  items: KitchenOrderItem[]
}
