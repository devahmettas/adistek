import apiClient from './client'
import type { ApiResponse, Restaurant } from './types'

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants')
  return data.data
}

export const createRestaurant = async (name: string): Promise<Restaurant> => {
  const { data } = await apiClient.post<ApiResponse<Restaurant>>('/restaurants', { name })
  return data.data
}
