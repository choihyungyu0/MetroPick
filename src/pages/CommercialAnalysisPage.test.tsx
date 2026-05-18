import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommercialAnalysisPage } from './CommercialAnalysisPage'

vi.mock('react-leaflet', async () => {
  const React = await import('react')

  const Layer = ({ children }: { children?: ReactNode }) =>
    React.createElement('div', null, children)

  return {
    Circle: Layer,
    CircleMarker: Layer,
    MapContainer: ({ children }: { children?: ReactNode }) =>
      React.createElement('div', { 'data-testid': 'leaflet-map' }, children),
    Polyline: Layer,
    Popup: Layer,
    TileLayer: () => React.createElement('div', { 'data-testid': 'osm-tile-layer' }),
    Tooltip: Layer,
    useMap: () => ({
      fitBounds: () => undefined,
      setView: () => undefined,
    }),
  }
})

function mapDataResponse(input: RequestInfo | URL) {
  const url = new URL(String(input))
  const radius = Number(url.searchParams.get('radius_m') ?? '500')
  const businessType = url.searchParams.get('business_type') ?? ''
  const selectedStationIds = url.searchParams.get('station_ids') ?? ''

  return {
    available_layers: ['line_1', 'line_2', 'stations', 'density'],
    business_distribution: businessType
      ? [
          {
            color: '#2563eb',
            count: 17,
            key: 'cafe',
            name: businessType,
            percent: 100,
          },
        ]
      : [
          {
            color: '#ef4444',
            count: 42,
            key: 'restaurant',
            name: '음식점',
            percent: 60,
          },
          {
            color: '#2563eb',
            count: 28,
            key: 'cafe',
            name: '카페/디저트',
            percent: 40,
          },
        ],
    bus_stop_markers: [],
    comparison_rows: [
      {
        averageFloatingPopulation: '공공 CSV 미제공',
        averageMonthlySales: '공공 CSV 미제공',
        competitionLevel: '높음 45.0/100',
        densityLevel: '높음',
        densityTone: 'warning',
        promisingBusinessTypes: [businessType || '음식점'],
        station: '상무역',
        station_id: 'L1_상무',
        storeCount: businessType ? 17 : 42,
      },
    ],
    data_status: 'public_store_csv',
    density_points: [
      {
        business_type: businessType || '음식점',
        business_type_key: businessType ? 'cafe' : 'restaurant',
        id: 'store-1',
        lat: 35.1468,
        lng: 126.8485,
        store_name: '테스트 점포',
        weight: 1,
      },
    ],
    filters: {
      business_type: businessType,
      business_type_key: businessType ? 'cafe' : '',
      layers: ['line_1', 'line_2', 'stations', 'density'],
      line: url.searchParams.get('line') ?? '전체',
      radius_m: radius,
      region: url.searchParams.get('region') ?? '광주광역시',
      station_ids: selectedStationIds ? selectedStationIds.split(',') : [],
    },
    insight_summaries: ['공공 상가 CSV와 역 좌표 CSV를 연결해 지도 레이어를 갱신했습니다.'],
    map: {
      center: { lat: 35.1468, lng: 126.8485 },
      zoom: selectedStationIds ? 15 : 12,
    },
    message: '공공 CSV 지도 테스트 응답',
    route_lines: [
      {
        color: '#2563eb',
        line: '1호선',
        points: [
          { lat: 35.1468, lng: 126.8485 },
          { lat: 35.1508, lng: 126.8588 },
        ],
      },
      {
        color: '#ef4444',
        line: '2호선',
        points: [
          { lat: 35.157955, lng: 126.848321 },
          { lat: 35.152441, lng: 126.848259 },
        ],
      },
    ],
    selected_station_circles: selectedStationIds
      ? [
          {
            lat: 35.1468,
            lng: 126.8485,
            radius_m: radius,
            station_id: 'L1_상무',
            station_name: '상무역',
          },
        ]
      : [],
    station_markers: [
      {
        business_counts: { cafe: 17, restaurant: 42 },
        district: '서구',
        dong: '치평동',
        lat: 35.1468,
        line: '1호선',
        lng: 126.8485,
        raw_station_name: '상무',
        score: {
          business_diversity_index: 71,
          competition_index: 45,
          startup_suitability_score: 62,
          total_store_count: 42,
        },
        selected: selectedStationIds.includes('L1_상무'),
        station_id: 'L1_상무',
        station_name: '상무역',
      },
      {
        business_counts: { cafe: 8, restaurant: 25 },
        district: '서구',
        dong: '쌍촌동',
        lat: 35.1508,
        line: '1호선',
        lng: 126.8588,
        raw_station_name: '운천',
        score: {
          business_diversity_index: 68,
          competition_index: 38,
          startup_suitability_score: 58,
          total_store_count: 25,
        },
        selected: false,
        station_id: 'L1_운천',
        station_name: '운천역',
      },
    ],
    summary_cards: [
      {
        change: `반경 ${radius}m`,
        desc: '공공 CSV',
        title: '분석 역세권',
        value: selectedStationIds ? '1개' : '2개',
      },
      {
        change: businessType || '전체 업종',
        desc: '지도 표시 기준',
        title: '필터 점포 수',
        value: businessType ? '17개' : '42개',
      },
    ],
  }
}

function mapDataFetchResponse(input: RequestInfo | URL): Response {
  return new Response(JSON.stringify(mapDataResponse(input)), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}

function renderCommercialAnalysisPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommercialAnalysisPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function getLastFetchUrl(): URL {
  const fetchMock = vi.mocked(fetch)
  const lastCall = fetchMock.mock.calls.at(-1)
  if (!lastCall) {
    throw new Error('fetch was not called')
  }
  return new URL(String(lastCall[0]))
}

describe('CommercialAnalysisPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) =>
        Promise.resolve({
          json: () => Promise.resolve(mapDataResponse(input)),
          ok: true,
        }),
      ),
    )
  })

  it('renders the commercial analysis layout with the interactive map', async () => {
    renderCommercialAnalysisPage()

    expect(screen.getByRole('heading', { name: '역세권 상권 분석' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '상권 분석 인터랙티브 지도' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('osm-tile-layer')).toBeInTheDocument()
    expect(
      screen.queryByAltText('광주 2호선 역세권 상권 밀집도 지도'),
    ).not.toBeInTheDocument()
    expect(await screen.findByText('FastAPI 실데이터 지도 연결됨')).toBeInTheDocument()
    expect(screen.getAllByText('42개').length).toBeGreaterThan(0)
  })

  it('calls map-data with selected station filters when analysis is applied', async () => {
    const user = userEvent.setup()
    renderCommercialAnalysisPage()

    await screen.findByLabelText(/상무역/)
    await user.click(screen.getByLabelText(/상무역/))
    await user.click(screen.getByRole('button', { name: '분석 적용' }))

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2))
    const url = getLastFetchUrl()
    expect(url.pathname).toBe('/api/commercial-analysis/map-data')
    expect(url.searchParams.get('station_ids')).toBe('L1_상무')
    expect(url.searchParams.get('region')).toBe('광주광역시')
  })

  it('does not auto-apply stale onboarding station selections', async () => {
    window.localStorage.setItem(
      'metropick-onboarding-stations',
      JSON.stringify({
        radius: '500m',
        route: '광주 2호선 (예정)',
        selectedStations: ['양산역', '상무역', '월드컵경기장역'],
      }),
    )
    renderCommercialAnalysisPage()

    await screen.findByText('FastAPI 실데이터 지도 연결됨')

    const firstUrl = new URL(String(vi.mocked(fetch).mock.calls[0]?.[0]))
    expect(firstUrl.searchParams.get('line')).toBe('2호선')
    expect(firstUrl.searchParams.has('station_ids')).toBe(false)
    expect(screen.getByText(/선택 영역 요약/)).toHaveTextContent('2개 역')
  })

  it('sends the changed radius request param', async () => {
    const user = userEvent.setup()
    renderCommercialAnalysisPage()

    await screen.findByText('FastAPI 실데이터 지도 연결됨')
    await user.click(screen.getByRole('button', { name: '1km' }))
    await user.click(screen.getByRole('button', { name: '분석 적용' }))

    await waitFor(() => expect(getLastFetchUrl().searchParams.get('radius_m')).toBe('1000'))
  })

  it('sends the changed business type request param and updates summary cards', async () => {
    const user = userEvent.setup()
    renderCommercialAnalysisPage()

    await screen.findByText('FastAPI 실데이터 지도 연결됨')
    await user.selectOptions(screen.getByLabelText('업종 선택'), '카페/디저트')
    await user.click(screen.getByRole('button', { name: '분석 적용' }))

    await waitFor(() =>
      expect(getLastFetchUrl().searchParams.get('business_type')).toBe('카페/디저트'),
    )
    expect(await screen.findByText('17개')).toBeInTheDocument()
  })

  it('keeps previous real map data visible while analysis refreshes', async () => {
    const user = userEvent.setup()
    let requestCount = 0
    let resolveRefresh: ((value: Response) => void) | undefined

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      requestCount += 1
      const response = mapDataFetchResponse(input)

      if (requestCount === 1) {
        return Promise.resolve(response)
      }

      return new Promise<Response>((resolve) => {
        resolveRefresh = resolve
      })
    })

    renderCommercialAnalysisPage()

    await screen.findByText('FastAPI 실데이터 지도 연결됨')
    expect(screen.getAllByText('42개').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('업종 선택'), '카페/디저트')
    await user.click(screen.getByRole('button', { name: '분석 적용' }))

    expect(screen.getByRole('button', { name: '분석 갱신 중' })).toBeDisabled()
    expect(screen.queryByText('12,843개')).not.toBeInTheDocument()
    expect(screen.getAllByText('42개').length).toBeGreaterThan(0)

    resolveRefresh?.(mapDataFetchResponse(getLastFetchUrl().toString()))

    expect(await screen.findByText('17개')).toBeInTheDocument()
  })

  it('saves a commercial analysis report to localStorage', async () => {
    const user = userEvent.setup()
    renderCommercialAnalysisPage()

    await screen.findByText('FastAPI 실데이터 지도 연결됨')
    await user.click(screen.getByRole('button', { name: '리포트로 저장' }))

    const raw = window.localStorage.getItem('metropick-saved-commercial-analysis-reports')
    expect(raw).not.toBeNull()

    const reports = JSON.parse(raw ?? '[]') as Array<{ title: string; radius: string }>
    expect(reports).toHaveLength(1)
    expect(reports[0]).toMatchObject({
      title: '역세권 상권 분석 리포트',
      radius: '500m',
    })
    expect(screen.getByText('리포트가 저장되었습니다.')).toBeInTheDocument()
  })
})
