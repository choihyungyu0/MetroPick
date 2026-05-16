import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createNotificationSettings,
  fetchNotificationSettings,
} from '@/shared/api/backendNotificationSettingsApi'
import {
  createOnboardingSettings,
  fetchOnboardingSettings,
} from '@/shared/api/backendOnboardingSettingsApi'
import {
  createPredictionResult,
  fetchPredictionResults,
} from '@/shared/api/backendPredictionResultsApi'
import { createSavedLocation, fetchSavedLocations } from '@/shared/api/backendSavedLocationsApi'
import { createSavedReport, fetchSavedReports } from '@/shared/api/backendSavedReportsApi'
import { clearAuthUser, saveAuthUser } from '@/shared/auth/authStorage'

type FetchCall = {
  body: Record<string, unknown>
  method: string
  url: string
}

function parseBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (!body) {
    return {}
  }

  return JSON.parse(String(body)) as Record<string, unknown>
}

describe('backend user scoping', () => {
  let fetchCalls: FetchCall[]

  beforeEach(() => {
    fetchCalls = []
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        fetchCalls.push({
          body: parseBody(init?.body),
          method: init?.method ?? 'GET',
          url: String(input),
        })

        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            location: {},
            locations: [],
            report: {},
            reports: [],
            result: {},
            results: [],
            setting: {},
            settings: [],
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }),
    )
  })

  afterEach(() => {
    clearAuthUser()
    vi.unstubAllGlobals()
  })

  it('adds the stored Supabase user id to create payloads', async () => {
    saveAuthUser({
      email: 'founder@metropick.ai',
      id: 'auth-user-id',
      name: '인증 사용자',
      role: '예비 창업자',
      source: 'supabase',
    })

    await createSavedReport({
      report_type: 'commercial_analysis',
      title: '충장로 카페 리포트',
    })
    await createSavedLocation({ station_name: '충장로역' })
    await createPredictionResult({ station_area: '충장로역' })
    await createNotificationSettings({ channels: ['email'] })
    await createOnboardingSettings({ region: '광주광역시' })

    expect(fetchCalls.map((call) => call.body.user_id)).toEqual([
      'auth-user-id',
      'auth-user-id',
      'auth-user-id',
      'auth-user-id',
      'auth-user-id',
    ])
  })

  it('adds the stored user id to list query strings', async () => {
    saveAuthUser({
      email: 'founder@metropick.ai',
      id: 'auth-user-id',
      name: '인증 사용자',
      role: '예비 창업자',
      source: 'supabase',
    })

    await fetchSavedReports()
    await fetchSavedLocations()
    await fetchPredictionResults()
    await fetchNotificationSettings()
    await fetchOnboardingSettings()

    expect(fetchCalls.map((call) => call.url)).toEqual([
      'http://127.0.0.1:8000/api/saved-reports?user_id=auth-user-id',
      'http://127.0.0.1:8000/api/saved-locations?user_id=auth-user-id',
      'http://127.0.0.1:8000/api/prediction-results?user_id=auth-user-id',
      'http://127.0.0.1:8000/api/notification-settings?user_id=auth-user-id',
      'http://127.0.0.1:8000/api/onboarding-settings?user_id=auth-user-id',
    ])
  })

  it('keeps backend calls usable when no stored auth user exists', async () => {
    await createSavedReport({
      report_type: 'commercial_analysis',
      title: '로컬 호환 리포트',
    })
    await fetchSavedReports()

    expect(fetchCalls[0]?.body).not.toHaveProperty('user_id')
    expect(fetchCalls[1]?.url).toBe('http://127.0.0.1:8000/api/saved-reports')
  })
})
