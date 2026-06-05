import apiClient from './client'
import type { ApiResponse, Category } from './types'

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories')
  return data.data
}

export const createCategory = async (name: string): Promise<Category> => {
  const { data } = await apiClient.post<ApiResponse<Category>>('/categories', { name })
  return data.data
}
