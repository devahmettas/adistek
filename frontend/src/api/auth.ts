import apiClient, { AUTH_ROLE_KEY } from './client'
import type {
  ApiResponse,
  AuthResponse,
  JewelerStaffAuthResponse,
  JewelerStaffUser,
  Restaurant,
} from './types'
import type { JewelerPermissionMap } from '../constants/jewelerPermissions'
import { JEWELER_OWNER_PERMISSIONS } from '../constants/jewelerPermissions'

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
    email,
    password,
  })
  return data.data
}

export const loginJewelerStaff = async (
  email: string,
  password: string,
): Promise<JewelerStaffAuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<JewelerStaffAuthResponse>>(
    '/jeweler-staff/auth/login',
    { email, password },
  )
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

export interface SessionPayload {
  restaurant: Restaurant
  staff: JewelerStaffUser | null
  permissions: JewelerPermissionMap
  isOwner: boolean
}

export const getSession = async (): Promise<SessionPayload> => {
  const role = localStorage.getItem(AUTH_ROLE_KEY)

  if (role === 'staff') {
    const { data } = await apiClient.get<ApiResponse<{
      staff: JewelerStaffUser
      restaurant: Restaurant
      permissions: JewelerPermissionMap
      is_owner: boolean
    }>>('/jeweler-staff/auth/me')

    return {
      restaurant: data.data.restaurant,
      staff: data.data.staff,
      permissions: data.data.permissions,
      isOwner: false,
    }
  }

  try {
    const restaurant = await getMe()

    return {
      restaurant,
      staff: null,
      permissions: JEWELER_OWNER_PERMISSIONS,
      isOwner: true,
    }
  } catch {
    const { data } = await apiClient.get<ApiResponse<{
      staff: JewelerStaffUser
      restaurant: Restaurant
      permissions: JewelerPermissionMap
      is_owner: boolean
    }>>('/jeweler-staff/auth/me')

    localStorage.setItem(AUTH_ROLE_KEY, 'staff')

    return {
      restaurant: data.data.restaurant,
      staff: data.data.staff,
      permissions: data.data.permissions,
      isOwner: false,
    }
  }
}

export const logout = async (isOwner: boolean): Promise<void> => {
  if (isOwner) {
    await apiClient.post('/auth/logout')
    return
  }

  await apiClient.post('/jeweler-staff/auth/logout')
}
