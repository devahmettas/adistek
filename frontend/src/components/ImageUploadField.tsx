import { useRef, useState } from 'react'
import { uploadImage } from '../api/menuUpload'
import { resolveMenuAssetUrl } from '../utils/menuAssetUrl'
import {
  ALLOWED_IMAGE_ACCEPT,
  ALLOWED_IMAGE_LABEL,
  isAllowedImageFile,
} from '../utils/imageUpload'
import Button from './Button'
import axios from 'axios'

interface ImageUploadFieldProps {
  label: string
  context: 'product' | 'slide' | 'category'
  module?: 'menu' | 'jeweler'
  imageUrl?: string | null
  imagePath?: string | null
  onChange: (payload: { path: string | null; url: string | null }) => void
}

const imageSizeHints: Record<ImageUploadFieldProps['context'], string> = {
  product: 'Önerilen boyut: 1200×900 px (4:3 oran)',
  category: 'Önerilen boyut: 512×512 px (kare)',
  slide: 'Önerilen boyut: 1920×640 px (geniş banner)',
}

export default function ImageUploadField({
  label,
  context,
  module = 'menu',
  imageUrl,
  imagePath,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = resolveMenuAssetUrl(imageUrl, imagePath)

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!isAllowedImageFile(file)) {
      setError(`Yalnızca ${ALLOWED_IMAGE_LABEL} dosyaları yüklenebilir.`)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Görsel boyutu en fazla 5 MB olabilir.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const result = await uploadImage(file, context, module)
      onChange({
        path: result.path,
        url: resolveMenuAssetUrl(result.url, result.path),
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message
        const validationMessage = error.response?.data?.errors?.image?.[0]

        if (validationMessage) {
          setError(validationMessage)
        } else if (serverMessage) {
          setError(serverMessage)
        } else if (error.response?.status === 403) {
          setError('Görsel yükleme yetkiniz yok.')
        } else {
          setError('Görsel yüklenemedi. Lütfen tekrar deneyin.')
        }
      } else {
        setError('Görsel yüklenemedi. Lütfen tekrar deneyin.')
      }
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {imageSizeHints[context]}. {ALLOWED_IMAGE_LABEL}, en fazla 5 MB.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3 sm:w-44">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain object-center" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Görsel yok
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Yükleniyor...' : imagePath ? 'Görseli Değiştir' : 'Görsel Yükle'}
          </Button>
          {imagePath && (
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => onChange({ path: null, url: null })}
            >
              Kaldır
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
