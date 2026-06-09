import type { AxiosInstance } from 'axios'
import apiClient from './client'
import type { ApiResponse, Category } from './types'

export const getCategories = async (client: AxiosInstance = apiClient): Promise<Category[]> => {
  const { data } = await client.get<ApiResponse<Category[]>>('/categories')
  return data.data
}

export interface CategoryPayload {
  name: string
  image_path?: string | null
}

export const createCategory = async (payload: CategoryPayload): Promise<Category> => {
  const { data } = await apiClient.post<ApiResponse<Category>>('/categories', payload)
  return data.data
}

export const updateCategory = async (
  categoryId: number,
  payload: CategoryPayload,
): Promise<Category> => {
  const { data } = await apiClient.put<ApiResponse<Category>>(`/categories/${categoryId}`, payload)
  return data.data
}

export const deleteCategory = async (categoryId: number): Promise<void> => {
  await apiClient.delete(`/categories/${categoryId}`)
}
