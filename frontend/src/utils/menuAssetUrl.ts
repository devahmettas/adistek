const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function resolveMenuAssetUrl(
  url: string | null | undefined,
  path?: string | null,
): string | null {
  if (path) {
    const normalizedPath = path.replace(/^\/+/, '')
    return `${API_ORIGIN}/storage/${normalizedPath}`
  }

  if (!url) {
    return null
  }

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url)
      const apiOrigin = new URL(API_ORIGIN || window.location.origin)

      if (
        (parsed.hostname === 'localhost' && apiOrigin.hostname === '127.0.0.1') ||
        (parsed.hostname === '127.0.0.1' && apiOrigin.hostname === 'localhost')
      ) {
        parsed.protocol = apiOrigin.protocol
        parsed.hostname = apiOrigin.hostname
        parsed.port = apiOrigin.port
        return parsed.toString()
      }

      return url
    } catch {
      return url
    }
  }

  if (url.startsWith('/storage/')) {
    return `${API_ORIGIN}${url}`
  }

  if (url.startsWith('storage/')) {
    return `${API_ORIGIN}/${url}`
  }

  return `${API_ORIGIN}/storage/${url.replace(/^\/+/, '')}`
}
