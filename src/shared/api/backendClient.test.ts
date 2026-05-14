import { describe, expect, it, vi } from 'vitest'

import { fetchBackendJson } from '@/shared/api/backendClient'

describe('fetchBackendJson', () => {
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
