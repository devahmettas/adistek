import apiClient from './client'
import type { ApiResponse, Product } from './types'

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<ApiResponse<Product[]>>('/products')
  return data.data
}

export const createProduct = async (payload: {
  category_id: number
  name: string
  price: number
  description?: string
}): Promise<Product> => {
  const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload)
  return data.data
}
