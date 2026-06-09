import { useRef, useState } from 'react'
import { uploadMenuImage } from '../api/menuUpload'
import { resolveMenuAssetUrl } from '../utils/menuAssetUrl'
import Button from './Button'

interface ImageUploadFieldProps {
  label: string
  context: 'product' | 'slide' | 'category'
  imageUrl?: string | null
  imagePath?: string | null
  onChange: (payload: { path: string | null; url: string | null }) => void
}

export default function ImageUploadField({
  label,
  context,
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

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      setError('Yalnızca JPG, JPEG, PNG veya WebP dosyaları yüklenebilir.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const result = await uploadMenuImage(file, context)
      onChange({
        path: result.path,
        url: resolveMenuAssetUrl(result.url, result.path),
      })
    } catch {
      setError('Görsel yüklenemedi. JPG, JPEG, PNG veya WebP ve en fazla 5 MB olmalı.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:w-40">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
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
            accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
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
