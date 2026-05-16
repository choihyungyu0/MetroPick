import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendNotificationSetting } from '@/shared/api/backendNotificationSettingsApi'
import type { BackendOnboardingSetting } from '@/shared/api/backendOnboardingSettingsApi'
import type { BackendPredictionResult } from '@/shared/api/backendPredictionResultsApi'
import type { BackendSavedLocation } from '@/shared/api/backendSavedLocationsApi'
import type { BackendSavedReport } from '@/shared/api/backendSavedReportsApi'
import { saveAuthUser } from '@/shared/auth/authStorage'

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}))

vi.mock('@/shared/auth/supabaseAuth', () => ({
  signOut: authMocks.signOut,
}))

import { MyPage } from './MyPage'

function renderMyPage(initialEntries = ['/mypage']) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <MyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockBackendSavedReports(
  reports: BackendSavedReport[],
  dataStatus = 'supabase_connected',
) {
  mockBackendApis({ reports, reportStatus: dataStatus })
}

function mockBackendApis({
  locations = [],
  locationStatus = 'supabase_missing',
  notificationSettings = [],
  notificationStatus = 'supabase_missing',
  onboardingSettings = [],
  onboardingStatus = 'supabase_missing',
  predictionResults = [],
  predictionStatus = 'supabase_missing',
  reports = [],
  reportStatus = 'supabase_missing',
}: {
  locations?: BackendSavedLocation[]
  locationStatus?: string
  notificationSettings?: BackendNotificationSetting[]
  notificationStatus?: string
  onboardingSettings?: BackendOnboardingSetting[]
  onboardingStatus?: string
  predictionResults?: BackendPredictionResult[]
  predictionStatus?: string
  reports?: BackendSavedReport[]
  reportStatus?: string
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/notification-settings')) {
        if (init?.method === 'POST' || init?.method === 'PATCH') {
          return {
            ok: true,
            json: async () => ({
              data_status: notificationStatus,
              setting: {
                id: 'backend-notification-setting',
                created_at: '2026-05-15T00:00:00+00:00',
                ...notificationSettings[0],
              },
            }),
          } satisfies Pick<Response, 'json' | 'ok'>
        }

        return {
          ok: true,
          json: async () => ({
            data_status: notificationStatus,
            settings: notificationSettings,
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/saved-reports')) {
        if (init?.method === 'PATCH') {
          return {
            ok: true,
            json: async () => ({
              data_status: reportStatus,
              report: {
                id: 'backend-commercial-report',
                created_at: '2026-05-15T00:00:00+00:00',
                ...reports[0],
              },
            }),
          } satisfies Pick<Response, 'json' | 'ok'>
        }

        if (init?.method === 'DELETE') {
          return {
            ok: true,
            json: async () => ({
              data_status: reportStatus,
              deleted: true,
              id: url.split('/').at(-1) ?? 'backend-commercial-report',
            }),
          } satisfies Pick<Response, 'json' | 'ok'>
        }

        return {
          ok: true,
          json: async () => ({
            data_status: reportStatus,
            reports,
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/onboarding-settings')) {
        return {
          ok: true,
          json: async () => ({
            data_status: onboardingStatus,
            settings: onboardingSettings,
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/prediction-results')) {
        return {
          ok: true,
          json: async () => ({
            data_status: predictionStatus,
            results: predictionResults,
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/saved-locations')) {
        return {
          ok: true,
          json: async () => ({
            data_status: locationStatus,
            locations,
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    }),
  )
}

describe('MyPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    authMocks.signOut.mockReset()
    authMocks.signOut.mockResolvedValue({ ok: true })
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('shows a logout button in the top-right actions and clears local auth', async () => {
    const user = userEvent.setup()
    saveAuthUser({
      email: 'founder@metropick.ai',
      id: 'auth-user-id',
      name: '인증 사용자',
      role: '예비 창업자',
      source: 'supabase',
    })

    renderMyPage()

    const logoutButton = screen.getAllByRole('button', { name: '로그아웃' }).at(0)
    if (!logoutButton) {
      throw new Error('Logout button was not rendered.')
    }

    await user.click(logoutButton)

    expect(authMocks.signOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
    })
    expect(window.localStorage.getItem('metropick-user')).toBeNull()
  })

  it('renders the profile and saved reports', () => {
    renderMyPage()

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByText('저장한 리포트')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('상무역 상권 분석 리포트')).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 저장 리포트 표시'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 초기 설정 표시'),
    ).toBeInTheDocument()
  })

  it('uses backend onboarding settings in the profile when connected', async () => {
    mockBackendApis({
      onboardingStatus: 'supabase_connected',
      onboardingSettings: [
        {
          id: 'older-backend-onboarding-setting',
          region: '북구',
          selected_stations: ['양산역'],
          selected_business_types: ['베이커리'],
          radius: '500m',
          notification_settings: {},
          created_at: '2026-05-14T00:00:00+00:00',
        },
        {
          id: 'backend-onboarding-setting',
          region: '서구',
          selected_stations: ['상무역', '운천역'],
          selected_business_types: ['카페/디저트', '음식점'],
          radius: '500m',
          notification_settings: {},
          created_at: '2026-05-15T00:00:00+00:00',
        },
      ],
    })

    renderMyPage()

    expect(await screen.findByText('Supabase 초기 설정 연결됨')).toBeInTheDocument()
    expect(screen.getByText('서구')).toBeInTheDocument()
    expect(screen.getByText('카페/디저트, 음식점')).toBeInTheDocument()
    expect(screen.queryByText('북구')).not.toBeInTheDocument()
  })

  it('falls back to local onboarding summary when backend onboarding fails', () => {
    window.localStorage.setItem(
      'metropick-onboarding-summary',
      JSON.stringify({
        completedAt: '2026-05-15T00:00:00+00:00',
        stations: { selectedStations: ['양산역'] },
        businessTypes: { selectedBusinessLabels: ['베이커리'] },
      }),
    )

    renderMyPage()

    expect(screen.getByText('양산역')).toBeInTheDocument()
    expect(screen.getByText('베이커리')).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 초기 설정 표시'),
    ).toBeInTheDocument()
  })

  it('renders backend reports when Supabase is connected', async () => {
    mockBackendSavedReports([
      {
        id: 'backend-commercial-report',
        report_type: 'commercial_analysis',
        title: '충장로 카페 상권 리포트',
        station_area: '충장로역',
        business_type: '카페',
        payload: { score: 82 },
        created_at: '2026-05-15T00:00:00+00:00',
      },
    ])

    renderMyPage()

    expect(await screen.findByText('충장로 카페 상권 리포트')).toBeInTheDocument()
    expect(screen.getByText('Supabase 리포트 연결됨')).toBeInTheDocument()
    expect(screen.getByText('충장로역')).toBeInTheDocument()
    expect(screen.getByText('카페')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('상무역 상권 분석 리포트')).not.toBeInTheDocument()
    })
  })

  it('falls back to localStorage reports when backend loading fails', () => {
    window.localStorage.setItem(
      'metropick-saved-commercial-analysis-reports',
      JSON.stringify([
        {
          id: 'local-commercial-report',
          title: '로컬 저장 상권 리포트',
          createdAt: '2026-05-15T09:30:00+09:00',
          selectedStations: ['금남로4가역'],
          selectedBusinessTypes: ['베이커리'],
        },
      ]),
    )

    renderMyPage()

    expect(screen.getByText('로컬 저장 상권 리포트')).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 저장 리포트 표시'),
    ).toBeInTheDocument()
  })

  it('keeps local fallback when backend returns supabase_missing', async () => {
    mockBackendSavedReports([], 'supabase_missing')

    renderMyPage()

    expect(await screen.findByText('상무역 상권 분석 리포트')).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 저장 리포트 표시'),
    ).toBeInTheDocument()
  })

  it('edits backend saved report metadata through the backend API', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/saved-reports') && init?.method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            report: {
              id: 'backend-commercial-report',
              report_type: 'commercial_analysis',
              title: '충장로 카페 상권 리포트',
              station_area: '충장로역',
              business_type: '카페',
              payload: {
                description: '야간 유동인구가 강한 권역입니다.',
                tags: ['야간상권', '카페'],
              },
              created_at: '2026-05-15T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/saved-reports')) {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            reports: [
              {
                id: 'backend-commercial-report',
                report_type: 'commercial_analysis',
                title: '충장로 카페 상권 리포트',
                station_area: '충장로역',
                business_type: '카페',
                payload: {},
                created_at: '2026-05-15T00:00:00+00:00',
              },
            ],
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      return {
        ok: true,
        json: async () => ({ data_status: 'supabase_missing', settings: [] }),
      } satisfies Pick<Response, 'json' | 'ok'>
    })
    vi.stubGlobal('fetch', fetchMock)

    renderMyPage()

    expect(await screen.findByText('충장로 카페 상권 리포트')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: '충장로 카페 상권 리포트 편집' }),
    )
    await user.type(screen.getByLabelText('설명'), '야간 유동인구가 강한 권역입니다.')
    await user.type(screen.getByLabelText('태그'), '야간상권, 카페')
    await user.click(screen.getByRole('button', { name: '수정 저장' }))

    expect(
      await screen.findByText('Supabase에 리포트 수정 내용을 저장했어요.'),
    ).toBeInTheDocument()

    const updateCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).includes('/api/saved-reports/backend-commercial-report') &&
        init?.method === 'PATCH',
    )
    expect(updateCall).toBeDefined()
    const body = JSON.parse(String(updateCall?.[1]?.body ?? '{}')) as {
      payload?: { description?: string; tags?: string[] }
    }
    expect(body.payload).toMatchObject({
      description: '야간 유동인구가 강한 권역입니다.',
      tags: ['야간상권', '카페'],
    })
  })

  it('edits fallback saved report metadata in localStorage', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      'metropick-saved-commercial-analysis-reports',
      JSON.stringify([
        {
          id: 'local-commercial-report',
          title: '로컬 저장 상권 리포트',
          createdAt: '2026-05-15T09:30:00+09:00',
          selectedStations: ['금남로4가역'],
          selectedBusinessTypes: ['베이커리'],
        },
      ]),
    )

    renderMyPage()

    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '로컬',
    )
    await user.click(
      screen.getByRole('button', { name: '로컬 저장 상권 리포트 편집' }),
    )
    await user.type(screen.getByLabelText('설명'), '로컬 수정 설명입니다.')
    await user.type(screen.getByLabelText('태그'), '테스트태그, 로컬')
    await user.click(screen.getByRole('button', { name: '수정 저장' }))

    expect(
      await screen.findByText('백엔드 미연결 · 로컬 리포트를 수정했어요.'),
    ).toBeInTheDocument()
    expect(screen.getByText('로컬 수정 설명입니다.')).toBeInTheDocument()
    expect(screen.getByText('#테스트태그')).toBeInTheDocument()

    const edits = JSON.parse(
      window.localStorage.getItem('metropick-saved-report-edits') ?? '{}',
    ) as Record<string, { description?: string; tags?: string[] }>
    expect(edits['local-commercial-report']).toMatchObject({
      description: '로컬 수정 설명입니다.',
      tags: ['테스트태그', '로컬'],
    })
  })

  it('deletes backend saved reports through the backend API', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/saved-reports') && init?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            deleted: true,
            id: 'backend-commercial-report',
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/saved-reports')) {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            reports: [
              {
                id: 'backend-commercial-report',
                report_type: 'commercial_analysis',
                title: '충장로 카페 상권 리포트',
                station_area: '충장로역',
                business_type: '카페',
                payload: {},
                created_at: '2026-05-15T00:00:00+00:00',
              },
            ],
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      return {
        ok: true,
        json: async () => ({ data_status: 'supabase_missing', settings: [] }),
      } satisfies Pick<Response, 'json' | 'ok'>
    })
    vi.stubGlobal('fetch', fetchMock)

    renderMyPage()

    expect(await screen.findByText('충장로 카페 상권 리포트')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: '충장로 카페 상권 리포트 삭제' }),
    )

    expect(
      await screen.findByText('Supabase에서 리포트를 삭제했어요.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('충장로 카페 상권 리포트')).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).includes('/api/saved-reports/backend-commercial-report') &&
          init?.method === 'DELETE',
      ),
    ).toBe(true)
  })

  it('deletes fallback saved reports from localStorage', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    window.localStorage.setItem(
      'metropick-saved-commercial-analysis-reports',
      JSON.stringify([
        {
          id: 'local-commercial-report',
          title: '로컬 저장 상권 리포트',
          createdAt: '2026-05-15T09:30:00+09:00',
          selectedStations: ['금남로4가역'],
          selectedBusinessTypes: ['베이커리'],
        },
      ]),
    )

    renderMyPage()

    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '로컬',
    )
    await user.click(
      screen.getByRole('button', { name: '로컬 저장 상권 리포트 삭제' }),
    )

    expect(
      await screen.findByText('백엔드 미연결 · 로컬 리포트를 삭제했어요.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('로컬 저장 상권 리포트')).not.toBeInTheDocument()

    const reports = JSON.parse(
      window.localStorage.getItem('metropick-saved-commercial-analysis-reports') ??
        '[]',
    ) as Array<{ id?: string }>
    expect(reports).toHaveLength(0)
  })

  it('searches edited report descriptions and tags', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      'metropick-saved-commercial-analysis-reports',
      JSON.stringify([
        {
          id: 'local-commercial-report',
          title: '로컬 저장 상권 리포트',
          createdAt: '2026-05-15T09:30:00+09:00',
          selectedStations: ['금남로4가역'],
          selectedBusinessTypes: ['베이커리'],
        },
      ]),
    )

    renderMyPage()

    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '로컬',
    )
    await user.click(
      screen.getByRole('button', { name: '로컬 저장 상권 리포트 편집' }),
    )
    await user.type(screen.getByLabelText('설명'), '강변 수요가 늘고 있습니다.')
    await user.type(screen.getByLabelText('태그'), '강변특화')
    await user.click(screen.getByRole('button', { name: '수정 저장' }))
    await user.clear(screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'))
    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '강변특화',
    )

    expect(screen.getByText('로컬 저장 상권 리포트')).toBeInTheDocument()
    expect(screen.getByText('#강변특화')).toBeInTheDocument()
  })

  it('shows backend prediction results when Supabase is connected', async () => {
    mockBackendApis({
      predictionStatus: 'supabase_connected',
      predictionResults: [
        {
          id: 'backend-prediction-result',
          station_area: '금남로4가역',
          business_type: '카페',
          predicted_score: 83.4,
          result_payload: {
            backendStartupSuitability: {
              recommendation_label: '창업 적합도 높음',
              predicted_score: 83.4,
            },
            predictedSalesIncrease: '+980만원',
            scenario: '광주 2호선 2단계 개통 - 2026년 예정',
          },
          created_at: '2026-05-15T00:00:00+00:00',
        },
      ],
    })

    renderMyPage()

    expect(await screen.findByText('금남로4가역 매출 예측 리포트')).toBeInTheDocument()
    expect(screen.getByText('Supabase AI 예측 결과 연결됨')).toBeInTheDocument()
    expect(screen.getByText('예측 점수 83.4점')).toBeInTheDocument()
    expect(screen.getByText(/창업 적합도 높음/)).toBeInTheDocument()
  })

  it('falls back to localStorage prediction results when backend fails', () => {
    window.localStorage.setItem(
      'metropick-ai-prediction-results',
      JSON.stringify([
        {
          id: 'local-prediction-result',
          stationArea: '양산역',
          businessType: '베이커리',
          predicted_score: 77.2,
          recommendation_label: '로컬 예측 결과',
          predictedSalesGrowthRate: 47.6,
          predictedSalesIncrease: '+1,280만원',
          predictedFloatingPopulationGrowthRate: 42.3,
          riskLevel: '보통',
          scenario: '광주 2호선 2단계 개통 - 2026년 예정',
          createdAt: '2026-05-15T09:30:00+09:00',
        },
      ]),
    )

    renderMyPage()

    expect(screen.getByText('양산역 매출 예측 리포트')).toBeInTheDocument()
    expect(screen.getByText('예측 점수 77.2점')).toBeInTheDocument()
    expect(screen.getByText(/로컬 예측 결과/)).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 AI 예측 결과 표시'),
    ).toBeInTheDocument()
  })

  it('shows interest locations from the tab panel', async () => {
    const user = userEvent.setup()
    renderMyPage()

    await user.click(screen.getByRole('tab', { name: '관심 역세권' }))

    expect(screen.getByText('백운광장역')).toBeInTheDocument()
    expect(screen.getByText('남구 백운동 · 카페/커피전문점')).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 관심 지역 표시'),
    ).toBeInTheDocument()
  })

  it('shows backend interest locations when Supabase is connected', async () => {
    const user = userEvent.setup()
    mockBackendApis({
      locationStatus: 'supabase_connected',
      locations: [
        {
          id: 'backend-location-geumnam',
          station_name: '금남로4가역',
          district: '동구',
          business_type: '카페',
          score: 91.5,
          payload: { reason: '유동 수요가 안정적인 권역입니다.' },
          created_at: '2026-05-15T00:00:00+00:00',
        },
      ],
    })

    renderMyPage()

    await user.click(screen.getByRole('tab', { name: '관심 역세권' }))

    expect(await screen.findByText('금남로4가역')).toBeInTheDocument()
    expect(screen.getByText('동구 · 카페')).toBeInTheDocument()
    expect(screen.getByText('91.5')).toBeInTheDocument()
    expect(screen.getByText('유동 수요가 안정적인 권역입니다.')).toBeInTheDocument()
    expect(screen.getByText('Supabase 관심 지역 연결됨')).toBeInTheDocument()
    expect(screen.queryByText('백운광장역')).not.toBeInTheDocument()
  })

  it('falls back to localStorage interest locations when backend fails', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      'metropick-saved-interest-locations',
      JSON.stringify([
        {
          id: 'local-interest-location',
          station: '양산역',
          district: '북구',
          businessType: '베이커리',
          score: 86,
          reason: '로컬 저장 관심 지역입니다.',
          savedAt: '2026-05-15T09:30:00+09:00',
        },
      ]),
    )

    renderMyPage()

    await user.click(screen.getByRole('tab', { name: '관심 역세권' }))

    expect(screen.getByText('양산역')).toBeInTheDocument()
    expect(screen.getByText('북구 · 베이커리')).toBeInTheDocument()
    expect(screen.getByText('로컬 저장 관심 지역입니다.')).toBeInTheDocument()
    expect(
      screen.getByText('백엔드 미연결 · 로컬 관심 지역 표시'),
    ).toBeInTheDocument()
  })

  it('opens a mypage tab from the query parameter', () => {
    renderMyPage(['/mypage?tab=interest-locations'])

    expect(screen.getByRole('tab', { name: '관심 역세권' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('백운광장역')).toBeInTheDocument()
  })

  it('shows notification settings and saves them to localStorage', async () => {
    const user = userEvent.setup()
    renderMyPage()

    await user.click(screen.getByRole('tab', { name: '알림 설정' }))
    await user.click(screen.getByRole('button', { name: '문자' }))
    await user.click(screen.getByRole('button', { name: '알림 설정 저장' }))

    expect(
      await screen.findByText('백엔드 미연결 · 로컬에 알림 설정을 저장했어요.'),
    ).toBeInTheDocument()

    const raw = window.localStorage.getItem('metropick-onboarding-notifications')
    expect(raw).not.toBeNull()
    const settings = JSON.parse(raw ?? '{}') as {
      channels?: { sms?: boolean }
    }
    expect(settings.channels?.sms).toBe(true)
  })

  it('uses backend notification settings in the notifications tab when connected', async () => {
    mockBackendApis({
      notificationStatus: 'supabase_connected',
      notificationSettings: [
        {
          id: 'older-notification-setting',
          channels: ['email'],
          frequency: 'daily',
          quiet_hours: { enabled: true, start: '23:00', end: '06:00' },
          enabled_notifications: ['이전 알림'],
          created_at: '2026-05-14T00:00:00+00:00',
        },
        {
          id: 'backend-notification-setting',
          channels: ['sms'],
          frequency: 'weekly',
          quiet_hours: { enabled: true, start: '21:00', end: '07:00' },
          enabled_notifications: ['경쟁도 변화 알림'],
          created_at: '2026-05-15T00:00:00+00:00',
        },
      ],
    })

    renderMyPage(['/mypage?tab=notifications'])

    expect(await screen.findByText('Supabase 알림 설정 연결됨')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '문자' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '이메일' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '매주' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('21:00 ~ 07:00')).toBeInTheDocument()
    expect(screen.getByText('경쟁도 변화 알림')).toBeInTheDocument()
    expect(screen.queryByText('이전 알림')).not.toBeInTheDocument()
  })

  it('falls back to localStorage notification settings when backend fails', () => {
    window.localStorage.setItem(
      'metropick-onboarding-notifications',
      JSON.stringify({
        channels: { email: false, sms: true, webPush: false },
        enabledNotificationLabels: ['로컬 알림'],
        frequency: '매일',
        quietHours: '20:00 ~ 06:00',
      }),
    )

    renderMyPage(['/mypage?tab=notifications'])

    expect(screen.getByText('백엔드 미연결 · 로컬 알림 설정 표시')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '문자' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '이메일' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '매일' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('20:00 ~ 06:00')).toBeInTheDocument()
    expect(screen.getByText('로컬 알림')).toBeInTheDocument()
  })

  it('updates backend notification settings from My Page when connected', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/notification-settings') && init?.method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            setting: {
              id: 'backend-notification-setting',
              channels: ['email', 'sms'],
              frequency: 'realtime',
              quiet_hours: { enabled: true, start: '22:00', end: '08:00' },
              enabled_notifications: ['개통 일정 업데이트'],
              created_at: '2026-05-15T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      if (url.includes('/api/notification-settings')) {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            settings: [
              {
                id: 'backend-notification-setting',
                channels: ['email'],
                frequency: 'realtime',
                quiet_hours: { enabled: true, start: '22:00', end: '08:00' },
                enabled_notifications: ['개통 일정 업데이트'],
                created_at: '2026-05-15T00:00:00+00:00',
              },
            ],
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      return {
        ok: true,
        json: async () => ({ data_status: 'supabase_missing', settings: [] }),
      } satisfies Pick<Response, 'json' | 'ok'>
    })
    vi.stubGlobal('fetch', fetchMock)

    renderMyPage(['/mypage?tab=notifications'])

    expect(await screen.findByText('Supabase 알림 설정 연결됨')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '문자' }))
    await user.click(screen.getByRole('button', { name: '알림 설정 저장' }))

    expect(
      await screen.findByText('Supabase에 알림 설정을 저장했어요.'),
    ).toBeInTheDocument()

    const updateCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).includes('/api/notification-settings/backend-notification-setting') &&
        init?.method === 'PATCH',
    )
    expect(updateCall).toBeDefined()
    const body = JSON.parse(String(updateCall?.[1]?.body ?? '{}')) as {
      channels?: string[]
      frequency?: string
      quiet_hours?: { end?: string; start?: string }
    }
    expect(body).toMatchObject({
      channels: ['email', 'sms'],
      frequency: 'realtime',
      quiet_hours: { start: '22:00', end: '08:00' },
    })
    expect(window.localStorage.getItem('metropick-onboarding-notifications')).toContain(
      '"sms":true',
    )
  })

  it('filters the saved report list by search query', async () => {
    const user = userEvent.setup()
    renderMyPage()

    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '쌍촌',
    )

    expect(screen.getByText('쌍촌역 매출 예측 리포트')).toBeInTheDocument()
    expect(screen.queryByText('상무역 상권 분석 리포트')).not.toBeInTheDocument()
  })

  it('applies search and category filters to backend reports', async () => {
    const user = userEvent.setup()
    mockBackendSavedReports([
      {
        id: 'backend-commercial-report',
        report_type: 'commercial_analysis',
        title: '충장로 카페 상권 리포트',
        station_area: '충장로역',
        business_type: '카페',
        payload: {},
        created_at: '2026-05-15T00:00:00+00:00',
      },
      {
        id: 'backend-ai-report',
        report_type: 'ai_prediction',
        title: '백운광장역 매출 예측 리포트',
        station_area: '백운광장역',
        business_type: '편의점',
        payload: {},
        created_at: '2026-05-14T00:00:00+00:00',
      },
    ])

    renderMyPage()

    expect(await screen.findByText('충장로 카페 상권 리포트')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /AI 예측/ }))

    expect(screen.getByText('백운광장역 매출 예측 리포트')).toBeInTheDocument()
    expect(screen.queryByText('충장로 카페 상권 리포트')).not.toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '백운',
    )

    expect(screen.getByText('백운광장역 매출 예측 리포트')).toBeInTheDocument()
  })

  it('shows copy feedback when sharing a report', async () => {
    const user = userEvent.setup()
    renderMyPage()

    const [shareButton] = screen.getAllByRole('button', { name: '공유' })
    expect(shareButton).toBeDefined()
    await user.click(shareButton!)

    expect(screen.getByText('리포트 링크가 복사되었습니다.')).toBeInTheDocument()
  })
})
