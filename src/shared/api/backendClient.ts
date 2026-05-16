import { getCurrentSession } from '@/shared/auth/supabaseAuth'

const LOCAL_API_BASE_URL = 'http://127.0.0.1:8000'

export function getBackendApiBaseUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_PUBLIC_API_BASE_URL?.trim()
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '')
  }

  return import.meta.env.DEV ? LOCAL_API_BASE_URL : null
}

function buildJsonHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  if (!nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }
  return nextHeaders
}

async function buildBackendHeaders(headers?: HeadersInit): Promise<Headers> {
  const nextHeaders = buildJsonHeaders(headers)
  if (nextHeaders.has('Authorization')) {
    return nextHeaders
  }

  try {
    const sessionResult = await getCurrentSession()
    if (sessionResult.ok && sessionResult.session?.access_token) {
      nextHeaders.set('Authorization', `Bearer ${sessionResult.session.access_token}`)
    }
  } catch {
    return nextHeaders
  }

  return nextHeaders
}

export async function fetchBackendJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const apiBaseUrl = getBackendApiBaseUrl()
  if (!apiBaseUrl) {
    throw new Error('Backend API base URL is not configured.')
  }

  const requestPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${apiBaseUrl}${requestPath}`, {
    ...options,
    headers: await buildBackendHeaders(options?.headers),
  })

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
