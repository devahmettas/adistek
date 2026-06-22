import { getGoogleMapsDirectionsUrl, hasUsableAddress } from '../../utils/adminMembership'

interface GoogleMapsDirectionsButtonProps {
  address?: string | null
  className?: string
}

export default function GoogleMapsDirectionsButton({
  address,
  className = '',
}: GoogleMapsDirectionsButtonProps) {
  if (!hasUsableAddress(address)) {
    return null
  }

  return (
    <a
      href={getGoogleMapsDirectionsUrl(address!)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        🗺
      </span>
      Google Haritalar&apos;da Yol Tarifi
    </a>
  )
}
