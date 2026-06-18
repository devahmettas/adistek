const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const STORAGE_BASE = import.meta.env.VITE_STORAGE_BASE_URL ?? ''

function getAssetOrigin(): string {
  if (STORAGE_BASE) {
    return STORAGE_BASE.replace(/\/+$/, '')
  }

  if (/^https?:\/\//i.test(API_BASE)) {
    return API_BASE.replace(/\/api\/?$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return API_BASE.replace(/\/api\/?$/, '') || ''
}

function normalizeStoragePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/^storage\//, '')
}

function harmonizeLocalhostUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const assetOrigin = new URL(getAssetOrigin() || window.location.origin)

    if (
      (parsed.hostname === 'localhost' && assetOrigin.hostname === '127.0.0.1') ||
      (parsed.hostname === '127.0.0.1' && assetOrigin.hostname === 'localhost')
    ) {
      parsed.protocol = assetOrigin.protocol
      parsed.hostname = assetOrigin.hostname
      parsed.port = assetOrigin.port
      return parsed.toString()
    }

    return url
  } catch {
    return url
  }
}

export function resolveMenuAssetUrl(
  url: string | null | undefined,
  path?: string | null,
): string | null {
  if (path) {
    if (/^https?:\/\//i.test(path)) {
      return harmonizeLocalhostUrl(path)
    }

    const normalizedPath = normalizeStoragePath(path)
    if (!normalizedPath) {
      return null
    }

    return `${getAssetOrigin()}/storage/${normalizedPath}`
  }

  if (!url) {
    return null
  }

  if (/^https?:\/\//i.test(url)) {
    return harmonizeLocalhostUrl(url)
  }

  const origin = getAssetOrigin()

  if (url.startsWith('/storage/')) {
    return `${origin}${url}`
  }

  if (url.startsWith('storage/')) {
    return `${origin}/${url}`
  }

  return `${origin}/storage/${normalizeStoragePath(url)}`
}
