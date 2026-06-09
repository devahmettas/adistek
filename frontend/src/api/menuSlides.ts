import apiClient from './client'
import type { ApiResponse } from './types'

export interface MenuSlide {
  id: number
  restaurant_id: number
  title: string
  subtitle: string | null
  image_path: string | null
  image_url: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export const getMenuSlides = async (): Promise<MenuSlide[]> => {
  const { data } = await apiClient.get<ApiResponse<MenuSlide[]>>('/menu-slides')
  return data.data
}

export const createMenuSlide = async (payload: {
  title: string
  subtitle?: string | null
  image_path?: string | null
  link_url?: string | null
  sort_order?: number
  is_active?: boolean
}): Promise<MenuSlide> => {
  const { data } = await apiClient.post<ApiResponse<MenuSlide>>('/menu-slides', payload)
  return data.data
}

export const updateMenuSlide = async (
  id: number,
  payload: {
    title: string
    subtitle?: string | null
    image_path?: string | null
    link_url?: string | null
    sort_order?: number
    is_active: boolean
  },
): Promise<MenuSlide> => {
  const { data } = await apiClient.put<ApiResponse<MenuSlide>>(`/menu-slides/${id}`, payload)
  return data.data
}

export const deleteMenuSlide = async (id: number): Promise<void> => {
  await apiClient.delete(`/menu-slides/${id}`)
}
