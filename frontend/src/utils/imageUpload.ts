export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
] as const

export function isAllowedImageFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mimeType = file.type.toLowerCase()

  const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.includes(
    extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number],
  )
  const hasAllowedMime =
    mimeType === '' ||
    ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])

  return hasAllowedExtension || hasAllowedMime
}

export const ALLOWED_IMAGE_ACCEPT =
  'image/jpeg,image/jpg,image/pjpeg,image/png,image/x-png,image/webp,.jpg,.jpeg,.png,.webp,image/*'

export const ALLOWED_IMAGE_LABEL = 'JPEG, JPG, PNG veya WebP'
