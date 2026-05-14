const API_BASE_URL =
  import.meta.env.VITE_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'

function buildJsonHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  if (!nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }
  return nextHeaders
}

export async function fetchBackendJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildJsonHeaders(options?.headers),
  })

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
