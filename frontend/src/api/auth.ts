import apiClient from './client'
import type { ApiResponse, AuthResponse, Restaurant } from './types'

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
    email,
    password,
  })
  return data.data
}

export const register = async (payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload)
  return data.data
}

export const getMe = async (): Promise<Restaurant> => {
  const { data } = await apiClient.get<ApiResponse<Restaurant>>('/auth/me')
  return data.data
}

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout')
}
