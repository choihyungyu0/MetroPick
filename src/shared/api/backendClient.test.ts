import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchBackendJson, getBackendApiBaseUrl } from '@/shared/api/backendClient'

describe('fetchBackendJson', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('uses the configured backend base URL without exposing localhost in deployed builds', async () => {
    vi.stubEnv('VITE_PUBLIC_API_BASE_URL', 'https://api.example.com/')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ status: 'ok' }),
        ok: true,
      } satisfies Pick<Response, 'json' | 'ok'>),
    )

    await expect(fetchBackendJson('/health')).resolves.toEqual({ status: 'ok' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/health',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
  })

  it('falls back to the local backend during Vite development', () => {
    vi.stubEnv('VITE_PUBLIC_API_BASE_URL', '')

    expect(getBackendApiBaseUrl()).toBe('http://127.0.0.1:8000')
  })

  it('throws when the backend response is not OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      } satisfies Pick<Response, 'ok' | 'status'>),
    )

    await expect(fetchBackendJson('/health')).rejects.toThrow(
      'Backend request failed: 503',
    )
  })
})
