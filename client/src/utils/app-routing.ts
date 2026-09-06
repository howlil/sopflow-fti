import { ROUTES } from '@/utils/constants'

export function parseSafeInternalRedirect(redirect: string | undefined): string | null {
  if (redirect == null || redirect.trim() === '') return null
  if (typeof window === 'undefined') return null

  try {
    const raw = redirect.trim()
    const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin) return null

    const path = `${url.pathname}${url.search}${url.hash}`
    if (path === '/' || path.startsWith('/login')) return null
    return path
  } catch {
    return null
  }
}

export function resolvePostLoginPath(redirect: string | undefined): string {
  return parseSafeInternalRedirect(redirect) ?? ROUTES.WORK
}

type NavigateLike = (opts: {
  to: string
  search?: Record<string, string>
  hash?: `#${string}`
}) => void

export function navigateToAppPath(navigate: NavigateLike, pathWithQueryHash: string): void {
  const url = new URL(pathWithQueryHash, window.location.origin)
  const search: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    search[key] = value
  })
  navigate({
    to: url.pathname,
    ...(Object.keys(search).length > 0 ? { search } : {}),
    ...(url.hash ? { hash: url.hash as `#${string}` } : {}),
  })
}

export function redirectArgsFromAppPath(pathWithQueryHash: string): {
  to: string
  search?: Record<string, string>
  hash?: `#${string}`
} {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  const url = new URL(pathWithQueryHash, base)
  const search: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    search[key] = value
  })
  return {
    to: url.pathname,
    ...(Object.keys(search).length > 0 ? { search } : {}),
    ...(url.hash ? { hash: url.hash as `#${string}` } : {}),
  }
}
