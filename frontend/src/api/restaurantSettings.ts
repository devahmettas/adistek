import apiClient from './client'
import type { ApiResponse } from './types'

export interface RestaurantSettings {
  reservation_duration_minutes: number
  reservation_visible_before_minutes: number
  reservation_start_time: string
  reservation_end_time: string
}

export const getRestaurantSettings = async (): Promise<RestaurantSettings> => {
  const { data } = await apiClient.get<ApiResponse<RestaurantSettings>>('/restaurant/settings')
  return data.data
}

export const updateRestaurantSettings = async (
  payload: RestaurantSettings,
): Promise<RestaurantSettings> => {
  const { data } = await apiClient.patch<ApiResponse<RestaurantSettings> & { message: string }>(
    '/restaurant/settings',
    payload,
  )
  return data.data
}
