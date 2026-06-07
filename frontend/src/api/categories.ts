import type { AxiosInstance } from 'axios'
import apiClient from './client'
import type { ApiResponse, Category } from './types'

export const getCategories = async (client: AxiosInstance = apiClient): Promise<Category[]> => {
  const { data } = await client.get<ApiResponse<Category[]>>('/categories')
  return data.data
}

export const createCategory = async (name: string): Promise<Category> => {
  const { data } = await apiClient.post<ApiResponse<Category>>('/categories', { name })
  return data.data
}

export const updateCategory = async (categoryId: number, name: string): Promise<Category> => {
  const { data } = await apiClient.put<ApiResponse<Category>>(`/categories/${categoryId}`, { name })
  return data.data
}

export const deleteCategory = async (categoryId: number): Promise<void> => {
  await apiClient.delete(`/categories/${categoryId}`)
}
