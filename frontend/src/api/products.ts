import apiClient from './client'
import type { ApiResponse, Product } from './types'

export const getProducts = async (restaurantId: number): Promise<Product[]> => {
  const { data } = await apiClient.get<ApiResponse<Product[]>>('/products', {
    params: { restaurant_id: restaurantId },
  })
  return data.data
}

export const createProduct = async (payload: {
  restaurant_id: number
  category_id: number
  name: string
  price: number
  description?: string
}): Promise<Product> => {
  const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload)
  return data.data
}
