import apiClient from './client'
import type { ApiResponse } from './types'

export interface TableReservation {
  id: number
  restaurant_table_id: number
  table_name?: string | null
  customer_name: string
  phone: string
  guest_count: number
  reserved_at: string
  reserved_time: string
  reserved_end_time?: string
  duration_minutes: number
  created_at?: string | null
}

export interface ReservationDayTable {
  id: number
  name: string
  current_status: string
  has_reservations_on_date: boolean
  is_actively_reserved: boolean
  reservations: TableReservation[]
}

export interface ReservationDayOverview {
  date: string
  reservation_duration_minutes: number
  reservation_visible_before_minutes: number
  reservation_start_time: string
  reservation_end_time: string
  reservations: TableReservation[]
  tables: ReservationDayTable[]
}

export interface CreateReservationPayload {
  restaurant_table_id: number
  customer_name: string
  phone: string
  guest_count: number
  reserved_at: string
  duration_minutes?: number
}

export interface UpdateReservationPayload {
  restaurant_table_id: number
  customer_name: string
  phone: string
  guest_count: number
  reserved_at: string
  duration_minutes?: number
}

export const getReservationDay = async (date: string): Promise<ReservationDayOverview> => {
  const { data } = await apiClient.get<ApiResponse<ReservationDayOverview>>('/reservations', {
    params: { date },
  })
  return data.data
}

export const createReservation = async (
  payload: CreateReservationPayload,
): Promise<TableReservation> => {
  const { data } = await apiClient.post<ApiResponse<TableReservation> & { message: string }>(
    '/reservations',
    payload,
  )
  return data.data
}

export const updateReservation = async (
  reservationId: number,
  payload: UpdateReservationPayload,
): Promise<TableReservation> => {
  const { data } = await apiClient.put<ApiResponse<TableReservation> & { message: string }>(
    `/reservations/${reservationId}`,
    payload,
  )
  return data.data
}

export const cancelReservation = async (reservationId: number): Promise<void> => {
  await apiClient.delete(`/reservations/${reservationId}`)
}
