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
  created_at: string
  category?: Category
}

export interface RestaurantTable {
  id: number
  restaurant_id: number
  name: string
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
