import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecommendationPage } from './RecommendationPage'

function renderRecommendationPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecommendationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockRecommendationResponse({
  dataStatus,
  displayStationName,
  stationName,
}: {
  dataStatus: 'recommendation_csv' | 'sample_fixture'
  displayStationName?: string
  stationName: string
}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/recommendations')) {
      return {
        ok: true,
        json: async () => ({
          data_status: dataStatus,
          message:
            dataStatus === 'recommendation_csv'
              ? '로컬 추천 Top 5 CSV 기반 결과입니다.'
              : '현재 추천은 샘플 데이터와 규칙 기반 점수로 제공됩니다.',
          items: [
            {
              station_id: stationName,
              station_name: stationName,
              display_station_name: displayStationName,
              recommendation_label: '추가 검토',
              startup_suitability_score: 72.78,
              floating_demand_index: 79.15,
              competition_index: 50,
              business_diversity_index: 76,
              data_status: dataStatus,
            },
          ],
        }),
      } satisfies Pick<Response, 'json' | 'ok'>
    }

    throw new Error('offline')
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function mockSavedLocationCreate() {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/saved-locations') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            location: {
              id: 'backend-location-sangmu',
              station_name: '상무역',
              district: '서구 치평동',
              business_type: '카페/디저트',
              score: 92,
              payload: {
                rank: 1,
                risk: '위험 낮음',
                reason: '상무지구 중심 상권',
                metrics: {
                  growth: 93,
                  stability: 88,
                  competition: 72,
                  accessibility: 94,
                },
              },
              created_at: '2026-05-15T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('RecommendationPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('renders the location recommendation layout with the map image', () => {
    renderRecommendationPage()

    expect(
      screen.getByRole('heading', { name: '창업 유망 지점 추천' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('광주 2호선 창업 유망 지점 추천 지도')).toBeInTheDocument()
    expect(screen.getByText('AI 추천 Top 5')).toBeInTheDocument()
    expect(screen.getAllByText('상무역').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByText('입지 추천')
        .some((item) => item.getAttribute('aria-current') === 'page'),
    ).toBe(true)
  })

  it('shows the CSV-connected badge when recommendations use CSV data', async () => {
    mockRecommendationResponse({
      dataStatus: 'recommendation_csv',
      displayStationName: '서남동 예정역',
      stationName: '2호선_215',
    })

    renderRecommendationPage()

    expect(await screen.findByText('FastAPI 추천 CSV 연결됨')).toBeInTheDocument()
    expect(screen.queryByText('FastAPI 샘플 추천 연결됨')).not.toBeInTheDocument()
  })

  it('shows the sample badge when recommendations fall back to sample fixtures', async () => {
    mockRecommendationResponse({
      dataStatus: 'sample_fixture',
      stationName: '상무역',
    })

    renderRecommendationPage()

    expect(await screen.findByText('FastAPI 샘플 추천 연결됨')).toBeInTheDocument()
  })

  it('uses display station names instead of internal station codes', async () => {
    mockRecommendationResponse({
      dataStatus: 'recommendation_csv',
      displayStationName: '서남동 예정역',
      stationName: '2호선_215',
    })

    renderRecommendationPage()

    expect(await screen.findByRole('heading', { name: '서남동 예정역' })).toBeInTheDocument()
    expect(screen.queryByText('2호선_215')).not.toBeInTheDocument()
  })

  it('saves an interest location through the backend and syncs localStorage', async () => {
    const fetchMock = mockSavedLocationCreate()
    const user = userEvent.setup()
    renderRecommendationPage()

    const saveButtons = screen.getAllByRole('button', { name: /관심 지역 저장/ })
    await user.click(saveButtons[0] as HTMLElement)

    expect(
      await screen.findByText('Supabase에 관심 지역을 저장했어요.'),
    ).toBeInTheDocument()

    const savedLocationCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/saved-locations'),
    )
    expect(savedLocationCall).toBeDefined()

    const requestInit = savedLocationCall?.[1] as RequestInit | undefined
    expect(requestInit?.method).toBe('POST')

    const body = JSON.parse(String(requestInit?.body ?? '{}')) as {
      business_type?: string
      payload?: { metrics?: { growth?: number }; rank?: number; reason?: string }
      score?: number
      station_name?: string
    }
    expect(body).toMatchObject({
      station_name: '상무역',
      business_type: '카페/디저트',
      score: 92,
    })
    expect(body.payload).toMatchObject({
      rank: 1,
      reason: expect.any(String) as string,
      metrics: { growth: 93 },
    })

    const raw = window.localStorage.getItem('metropick-saved-interest-locations')
    const saved = JSON.parse(raw ?? '[]') as Array<{
      id: string
      businessType: string
      score: number
      station: string
    }>
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      id: 'backend-location-sangmu',
      businessType: '카페/디저트',
      score: 92,
      station: '상무역',
    })
  })

  it('falls back to localStorage when backend save fails', async () => {
    const user = userEvent.setup()
    renderRecommendationPage()

    const saveButtons = screen.getAllByRole('button', { name: /관심 지역 저장/ })
    await user.click(saveButtons[0] as HTMLElement)

    const raw = window.localStorage.getItem('metropick-saved-interest-locations')
    expect(raw).not.toBeNull()

    const saved = JSON.parse(raw ?? '[]') as Array<{
      businessType: string
      score: number
      station: string
    }>
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      businessType: '카페/디저트',
      score: 92,
      station: '상무역',
    })
    expect(
      screen.getByText('백엔드 미연결 · 로컬에 관심 지역을 저장했어요.'),
    ).toBeInTheDocument()
  })
})
