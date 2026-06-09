import apiClient from './client'
import type { ApiResponse } from './types'

export interface MenuSettings {
  menu_tagline: string | null
  menu_welcome_text: string | null
}

export const getMenuSettings = async (): Promise<MenuSettings> => {
  const { data } = await apiClient.get<ApiResponse<MenuSettings>>('/restaurant/menu-settings')
  return data.data
}

export const updateMenuSettings = async (payload: MenuSettings): Promise<MenuSettings> => {
  const { data } = await apiClient.patch<ApiResponse<MenuSettings>>(
    '/restaurant/menu-settings',
    payload,
  )
  return data.data
}
