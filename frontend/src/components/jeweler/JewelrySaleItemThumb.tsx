import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'

interface JewelrySaleItemThumbProps {
  imagePath?: string | null
  imageUrl?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const SIZE_CLASSES = {
  xs: 'h-7 w-7 rounded-md',
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-12 w-12 rounded-xl',
}

export default function JewelrySaleItemThumb({
  imagePath,
  imageUrl,
  name,
  size = 'sm',
  className = '',
}: JewelrySaleItemThumbProps) {
  const previewUrl = resolveMenuAssetUrl(imageUrl, imagePath ?? null)

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-100 bg-slate-50 ${SIZE_CLASSES[size]} ${className}`}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={name}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span className="text-[9px] text-slate-400">—</span>
      )}
    </div>
  )
}
