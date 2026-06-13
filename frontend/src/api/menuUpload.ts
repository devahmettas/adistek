import axios from 'axios'
import apiClient from './client'
import type { ApiResponse } from './types'

export interface MenuUploadResult {
  path: string
  url: string
}

type UploadContext = 'product' | 'slide' | 'category'
type UploadModule = 'menu' | 'jeweler'

function buildFormData(file: File, context: UploadContext): FormData {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('context', context)
  return formData
}

async function postMultipartUpload(
  url: string,
  file: File,
  context: UploadContext,
): Promise<MenuUploadResult> {
  const formData = buildFormData(file, context)

  const { data } = await apiClient.post<ApiResponse<MenuUploadResult>>(url, formData, {
    headers: {
      'Content-Type': undefined,
    },
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers === 'object') {
          if (headers instanceof axios.AxiosHeaders) {
            headers.delete('Content-Type')
          } else {
            delete (headers as Record<string, unknown>)['Content-Type']
          }
        }
        return body
      },
    ],
  })

  return data.data
}

export const uploadMenuImage = async (
  file: File,
  context: UploadContext,
): Promise<MenuUploadResult> => postMultipartUpload('/menu/uploads', file, context)

export const uploadJewelryImage = async (
  file: File,
  context: UploadContext = 'product',
): Promise<MenuUploadResult> => postMultipartUpload('/jeweler/uploads', file, context)

export const uploadImage = async (
  file: File,
  context: UploadContext,
  module: UploadModule = 'menu',
): Promise<MenuUploadResult> => {
  return module === 'jeweler'
    ? uploadJewelryImage(file, context)
    : uploadMenuImage(file, context)
}
