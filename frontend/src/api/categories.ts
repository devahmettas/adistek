import apiClient from './client'
import type { ApiResponse, Category } from './types'

export const getCategories = async (restaurantId: number): Promise<Category[]> => {
  const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories', {
    params: { restaurant_id: restaurantId },
  })
  return data.data
}

export const createCategory = async (
  restaurantId: number,
  name: string,
): Promise<Category> => {
  const { data } = await apiClient.post<ApiResponse<Category>>('/categories', {
    restaurant_id: restaurantId,
    name,
  })
  return data.data
}
