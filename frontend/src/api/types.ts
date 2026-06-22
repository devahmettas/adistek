import type { BusinessType } from '../constants/businessType'

export interface Restaurant {
  id: number
  name: string
  business_type?: BusinessType
  slug?: string | null
  contact_person?: string | null
  phone?: string | null
  address?: string | null
  service_fee?: string | number | null
  membership_end_date?: string | null
  membership_days_remaining?: number
  membership_expired?: boolean
  email: string
  feature_order_tracking?: boolean
  feature_qr_menu?: boolean
  feature_reservations?: boolean
  feature_jeweler_barcode?: boolean
  feature_jeweler_reports?: boolean
  reservation_duration_minutes?: number
  reservation_visible_before_minutes?: number
  created_at: string
}

export interface Category {
  id: number
  restaurant_id: number
  name: string
  image_path?: string | null
  image_url?: string | null
  created_at: string
}

import type { AllergenKey } from '../constants/allergens'

export interface Product {
  id: number
  restaurant_id: number
  category_id: number
  name: string
  price: string
  description: string | null
  image_path: string | null
  image_url: string | null
  calories: number | null
  allergens: AllergenKey[]
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

export interface TableTodayReservation {
  id: number
  reserved_time: string
  customer_name: string
  guest_count: number
}

export interface RestaurantTable {
  id: number
  restaurant_id: number
  name: string
  qr_token: string
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
  is_actively_reserved?: boolean
  today_reservations?: TableTodayReservation[]
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
  jewelry_categories_count?: number
  jewelry_products_count?: number
  jewelry_customers_count?: number
  jewelry_sales_count?: number
  jewelry_repairs_count?: number
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
