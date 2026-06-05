import adminApiClient from './adminClient'
import type { Admin, AdminAuthResponse, ApiResponse, RestaurantListItem } from './types'

export const adminLogin = async (email: string, password: string): Promise<AdminAuthResponse> => {
  const { data } = await adminApiClient.post<ApiResponse<AdminAuthResponse>>('/admin/auth/login', {
    email,
    password,
  })
  return data.data
}

export const getAdminMe = async (): Promise<Admin> => {
  const { data } = await adminApiClient.get<ApiResponse<Admin>>('/admin/auth/me')
  return data.data
}

export const adminLogout = async (): Promise<void> => {
  await adminApiClient.post('/admin/auth/logout')
}

export const getAdminRestaurants = async (): Promise<RestaurantListItem[]> => {
  const { data } = await adminApiClient.get<ApiResponse<RestaurantListItem[]>>('/admin/restaurants')
  return data.data
}
