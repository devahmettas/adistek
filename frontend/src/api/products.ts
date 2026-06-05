import apiClient from './client'
import type { ApiResponse, Product } from './types'

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<ApiResponse<Product[]>>('/products')
  return data.data
}

export const getProduct = async (id: number): Promise<Product> => {
  const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`)
  return data.data
}

export const createProduct = async (payload: {
  category_id: number
  name: string
  price: number
  description?: string
  is_active?: boolean
}): Promise<Product> => {
  const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload)
  return data.data
}

export const updateProduct = async (
  id: number,
  payload: {
    category_id: number
    name: string
    price: number
    description?: string | null
    is_active: boolean
  },
): Promise<Product> => {
  const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload)
  return data.data
}

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/products/${id}`)
}
