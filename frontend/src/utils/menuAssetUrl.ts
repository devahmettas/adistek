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
  let normalized = path.replace(/^\/+/, '')

  if (normalized.startsWith('api/media/')) {
    normalized = normalized.slice('api/media/'.length)
  }

  if (normalized.startsWith('storage/')) {
    normalized = normalized.slice('storage/'.length)
  }

  return normalized
}

function buildMediaUrl(normalizedPath: string): string | null {
  if (!normalizedPath || normalizedPath.includes('..')) {
    return null
  }

  return `${getAssetOrigin()}/api/media?path=${encodeURIComponent(normalizedPath)}`
}

function extractPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url, getAssetOrigin())
    const queryPath = parsed.searchParams.get('path')

    if (queryPath) {
      return normalizeStoragePath(queryPath)
    }

    const normalized = normalizeStoragePath(parsed.pathname)

    return normalized || null
  } catch {
    return null
  }
}

function rewriteLegacyAssetUrl(url: string): string | null {
  if (url.includes('/api/media')) {
    const path = extractPathFromUrl(url)
    return path ? buildMediaUrl(path) : null
  }

  const path = extractPathFromUrl(url)
  return path ? buildMediaUrl(path) : null
}

export function resolveMenuAssetUrl(
  url: string | null | undefined,
  path?: string | null,
): string | null {
  if (path) {
    if (/^https?:\/\//i.test(path)) {
      return rewriteLegacyAssetUrl(path) ?? path
    }

    return buildMediaUrl(normalizeStoragePath(path))
  }

  if (!url) {
    return null
  }

  if (/^https?:\/\//i.test(url)) {
    return rewriteLegacyAssetUrl(url) ?? url
  }

  if (url.startsWith('/api/media') || url.startsWith('api/media')) {
    const pathFromUrl = extractPathFromUrl(`${getAssetOrigin()}/${url.replace(/^\/+/, '')}`)
    return pathFromUrl ? buildMediaUrl(pathFromUrl) : `${getAssetOrigin()}/${url.replace(/^\/+/, '')}`
  }

  if (url.startsWith('/storage/') || url.startsWith('storage/')) {
    return buildMediaUrl(normalizeStoragePath(url))
  }

  return buildMediaUrl(normalizeStoragePath(url))
}

export function normalizeImageStoragePath(
  path: string | null | undefined,
): string | null {
  if (!path) {
    return null
  }

  if (/^https?:\/\//i.test(path)) {
    return extractPathFromUrl(path)
  }

  const normalized = normalizeStoragePath(path)
  return normalized || null
}
