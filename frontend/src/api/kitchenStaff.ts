import apiClient from './client'
import type { ApiResponse, KitchenStaff } from './types'

export const getKitchenStaff = async (): Promise<KitchenStaff[]> => {
  const { data } = await apiClient.get<ApiResponse<KitchenStaff[]>>('/kitchen-staff')
  return data.data
}

export const createKitchenStaff = async (payload: {
  name: string
  email: string
  password: string
}): Promise<KitchenStaff> => {
  const { data } = await apiClient.post<ApiResponse<KitchenStaff>>('/kitchen-staff', payload)
  return data.data
}

export const updateKitchenStaff = async (
  id: number,
  payload: {
    name?: string
    email?: string
    password?: string
    is_active?: boolean
  },
): Promise<KitchenStaff> => {
  const { data } = await apiClient.put<ApiResponse<KitchenStaff>>(`/kitchen-staff/${id}`, payload)
  return data.data
}

export const deleteKitchenStaff = async (id: number): Promise<void> => {
  await apiClient.delete(`/kitchen-staff/${id}`)
}
