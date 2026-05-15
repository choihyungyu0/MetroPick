import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendPredictionResult } from '@/shared/api/backendPredictionResultsApi'
import type { BackendSavedLocation } from '@/shared/api/backendSavedLocationsApi'
import type { BackendSavedReport } from '@/shared/api/backendSavedReportsApi'
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
  predictionResults = [],
  predictionStatus = 'supabase_missing',
  reports = [],
  reportStatus = 'supabase_missing',
}: {
  locations?: BackendSavedLocation[]
  locationStatus?: string
  predictionResults?: BackendPredictionResult[]
  predictionStatus?: string
  reports?: BackendSavedReport[]
  reportStatus?: string
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/saved-reports')) {
        return {
          ok: true,
          json: async () => ({
            data_status: reportStatus,
            reports,
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
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
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

    expect(screen.getByText('알림 설정이 저장되었습니다.')).toBeInTheDocument()

    const raw = window.localStorage.getItem('metropick-onboarding-notifications')
    expect(raw).not.toBeNull()
    const settings = JSON.parse(raw ?? '{}') as {
      channels?: { sms?: boolean }
    }
    expect(settings.channels?.sms).toBe(true)
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
