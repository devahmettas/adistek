import apiClient from './client'
import type { ApiResponse } from './types'

export interface MenuUploadResult {
  path: string
  url: string
}

export const uploadMenuImage = async (
  file: File,
  context: 'product' | 'slide',
): Promise<MenuUploadResult> => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('context', context)

  const { data } = await apiClient.post<ApiResponse<MenuUploadResult>>('/menu/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data.data
}
