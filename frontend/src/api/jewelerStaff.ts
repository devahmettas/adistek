import apiClient from './client'
import type { ApiResponse } from './types'
import type { JewelerPermissionMap } from '../constants/jewelerPermissions'

export interface JewelerStaffMember {
  id: number
  restaurant_id: number
  name: string
  email: string
  is_active: boolean
  permissions: JewelerPermissionMap
  created_at: string
}

export interface JewelerPermissionCatalogItem {
  key: keyof JewelerPermissionMap
  label: string
  default: boolean
}

export async function getJewelerStaff(): Promise<JewelerStaffMember[]> {
  const { data } = await apiClient.get<ApiResponse<JewelerStaffMember[]>>('/jeweler/staff')
  return data.data
}

export async function createJewelerStaff(payload: {
  name: string
  email: string
  password: string
  permissions?: Partial<JewelerPermissionMap>
  is_active?: boolean
}): Promise<JewelerStaffMember> {
  const { data } = await apiClient.post<ApiResponse<JewelerStaffMember>>('/jeweler/staff', payload)
  return data.data
}

export async function updateJewelerStaff(
  id: number,
  payload: {
    name?: string
    email?: string
    password?: string
    permissions?: Partial<JewelerPermissionMap>
    is_active?: boolean
  },
): Promise<JewelerStaffMember> {
  const { data } = await apiClient.put<ApiResponse<JewelerStaffMember>>(`/jeweler/staff/${id}`, payload)
  return data.data
}

export async function deleteJewelerStaff(id: number): Promise<void> {
  await apiClient.delete(`/jeweler/staff/${id}`)
}

export async function getJewelerPermissionCatalog(): Promise<JewelerPermissionCatalogItem[]> {
  const { data } = await apiClient.get<ApiResponse<{ permissions: JewelerPermissionCatalogItem[] }>>(
    '/jeweler/staff/permissions',
  )
  return data.data.permissions
}

export interface JewelerProfilePayload {
  restaurant: {
    id: number
    name: string
    email: string
    phone?: string | null
    address?: string | null
    contact_person?: string | null
    service_fee?: string | number | null
    membership_end_date?: string | null
    membership_days_remaining?: number
    membership_expired?: boolean
  }
  membership: {
    service_fee: number
    membership_end_date: string | null
    membership_days_remaining: number
    membership_expired: boolean
  }
  is_owner: boolean
}

export async function getJewelerProfile(): Promise<JewelerProfilePayload> {
  const { data } = await apiClient.get<ApiResponse<JewelerProfilePayload>>('/jeweler/profile')
  return data.data
}

export async function updateJewelerProfile(payload: {
  name: string
  contact_person?: string | null
  phone?: string | null
  address?: string | null
}): Promise<JewelerProfilePayload> {
  const { data } = await apiClient.patch<ApiResponse<JewelerProfilePayload>>('/jeweler/profile', payload)
  return data.data
}
