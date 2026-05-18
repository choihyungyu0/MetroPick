import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecommendationPage } from './RecommendationPage'

vi.mock('react-leaflet', async () => {
  const React = await import('react')

  const Layer = ({ children }: { children?: ReactNode }) =>
    React.createElement('div', null, children)

  return {
    MapContainer: ({ children }: { children?: ReactNode }) =>
      React.createElement('div', { 'data-testid': 'recommendation-leaflet-map' }, children),
    Marker: ({ children }: { children?: ReactNode }) =>
      React.createElement('div', { 'data-testid': 'recommendation-map-marker' }, children),
    Polyline: () => React.createElement('div', { 'data-testid': 'recommendation-route' }),
    Popup: Layer,
    TileLayer: () => React.createElement('div', { 'data-testid': 'osm-tile-layer' }),
    Tooltip: Layer,
    useMap: () => ({
      fitBounds: () => undefined,
      setView: () => undefined,
    }),
  }
})

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
  duplicateDisplayStationName,
  itemCount = 1,
  stationName,
  withCoordinates = dataStatus === 'recommendation_csv',
}: {
  dataStatus: 'recommendation_csv' | 'sample_fixture'
  displayStationName?: string
  duplicateDisplayStationName?: string
  itemCount?: number
  stationName: string
  withCoordinates?: boolean
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
          items: Array.from({ length: itemCount }, (_, index) => {
            const rank = index + 1
            const currentStationName =
              rank === 1 ? stationName : `2호선_${200 + rank}`
            const currentDisplayStationName =
              duplicateDisplayStationName ??
              (rank === 1
                ? (displayStationName ?? stationName)
                : `테스트 ${rank} 예정역`)

            return {
              rank,
              station_id: currentStationName,
              station_name: currentStationName,
              display_station_name: currentDisplayStationName,
              line: '2호선',
              lat: withCoordinates ? 35.14 + index * 0.01 : null,
              lng: withCoordinates ? 126.84 + index * 0.01 : null,
              recommended_business_type: rank % 2 === 0 ? '음식점' : '카페/디저트',
              recommendation_label: '추가 검토',
              startup_suitability_score: 72.78 + index,
              growth_score: 79.15,
              risk_level: rank % 2 === 0 ? '보통' : '낮음',
              floating_demand_index: 79.15,
              competition_index: 50,
              business_diversity_index: 76,
              data_status: dataStatus,
            }
          }),
          map: {
            center: [35.14, 126.84],
            zoom: 13,
            route: [
              [35.13, 126.83],
              [35.14, 126.84],
            ],
          },
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

  it('renders the location recommendation layout with the interactive map', () => {
    renderRecommendationPage()

    expect(
      screen.getByRole('heading', { name: '창업 유망 지점 추천' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '추천 지역 인터랙티브 지도' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('osm-tile-layer')).toBeInTheDocument()
    expect(
      screen.queryByAltText('광주 2호선 창업 유망 지점 추천 지도'),
    ).not.toBeInTheDocument()
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

  it('keeps recommendation keys unique when display station names repeat', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      mockRecommendationResponse({
        dataStatus: 'recommendation_csv',
        duplicateDisplayStationName: '지평동 예정역',
        itemCount: 5,
        stationName: '2호선_215',
      })

      renderRecommendationPage()

      await waitFor(() => {
        expect(screen.getAllByText('지평동 예정역').length).toBeGreaterThan(1)
      })

      const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((call) =>
        call.some((part) =>
          String(part).includes('Encountered two children with the same key'),
        ),
      )
      expect(duplicateKeyCalls).toHaveLength(0)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('renders RecommendationMap markers for Top 5 CSV coordinates', async () => {
    mockRecommendationResponse({
      dataStatus: 'recommendation_csv',
      displayStationName: '서남동 예정역',
      itemCount: 5,
      stationName: '2호선_215',
    })

    renderRecommendationPage()

    expect(await screen.findByText('추천 1 · 서남동 예정역')).toBeInTheDocument()
    expect(screen.getByText('추천 5 · 테스트 5 예정역')).toBeInTheDocument()
    expect(screen.getAllByTestId('recommendation-map-marker')).toHaveLength(5)
    expect(screen.getByTestId('recommendation-route')).toBeInTheDocument()
  })

  it('shows a safe map fallback when recommendation coordinates are missing', async () => {
    mockRecommendationResponse({
      dataStatus: 'recommendation_csv',
      displayStationName: '좌표없는 예정역',
      stationName: '좌표없는역',
      withCoordinates: false,
    })

    renderRecommendationPage()

    expect(
      await screen.findByText('추천 지역 좌표를 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryAllByTestId('recommendation-map-marker')).toHaveLength(0)
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
