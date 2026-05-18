import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from './DashboardPage'

vi.mock('leaflet', () => ({
  divIcon: (options: object) => options,
}))

vi.mock('react-leaflet', async () => {
  const React = await import('react')

  const Layer = ({ children }: { children?: ReactNode }) =>
    React.createElement('div', null, children)

  return {
    MapContainer: ({ children }: { children?: ReactNode }) =>
      React.createElement(
        'div',
        { 'data-testid': 'dashboard-recommendation-map' },
        children,
      ),
    Marker: Layer,
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

function createMapDataResponse() {
  return {
    available_layers: ['line_2', 'stations', 'density'],
    business_distribution: [
      {
        color: '#ef4444',
        count: 17958,
        key: 'restaurant',
        name: '음식점',
        percent: 24.2,
      },
      {
        color: '#8b5cf6',
        count: 17223,
        key: 'retail',
        name: '소매',
        percent: 23.2,
      },
    ],
    bus_stop_markers: [],
    comparison_rows: [],
    data_status: 'public_store_csv',
    density_points: [],
    filters: {
      business_type: '',
      business_type_key: 'all',
      layers: ['line_2', 'stations', 'density'],
      line: '2호선',
      radius_m: 500,
      region: '광주광역시',
      station_ids: [],
    },
    insight_summaries: ['공공 상가 CSV와 역 좌표 CSV를 연결했습니다.'],
    map: {
      center: { lat: 35.145721, lng: 126.855924 },
      zoom: 13,
    },
    message: '소상공인시장진흥공단 상가(상권)정보 로컬 CSV 기반 요약입니다.',
    route_lines: [],
    selected_station_circles: [],
    station_markers: [],
    summary_cards: [
      {
        change: '반경 500m',
        desc: '공공 CSV',
        title: '분석 역세권',
        value: '20개',
      },
      {
        change: '전체 업종',
        desc: '지도 표시 기준',
        title: '필터 점포 수',
        value: '74,205개',
      },
      {
        change: 'CSV 요약',
        desc: '높을수록 경쟁 집중',
        title: '평균 경쟁 지수',
        value: '38.1점',
      },
      {
        change: 'CSV 요약',
        desc: '점포 분포 기준',
        title: '평균 업종 다양성',
        value: '73.8점',
      },
    ],
  }
}

function createRecommendationsResponse() {
  return {
    data_status: 'recommendation_csv',
    items: [
      {
        business_diversity_index: 50,
        competition_index: 80.76,
        data_status: 'recommendation_csv',
        display_station_name: '상무2동 예정역',
        floating_demand_index: 96.74,
        growth_score: 96.74,
        lat: 35.147238,
        line: '2호선',
        lng: 126.848913,
        rank: 1,
        recommendation_label: '우선 검토',
        recommended_business_type: '소매/생활서비스',
        risk_level: '낮음',
        startup_suitability_score: 100,
        station_id: '2호선_203',
        station_name: '2호선_203',
      },
    ],
    map: {
      center: [35.145721, 126.855924],
      route: [[35.147238, 126.848913]],
      zoom: 13,
    },
    message: '로컬 추천 Top 5 CSV 기반 결과입니다.',
  }
}

type DashboardFetchOptions = {
  mapData?: ReturnType<typeof createMapDataResponse>
  recommendations?: ReturnType<typeof createRecommendationsResponse>
}

function mockDashboardFetch({
  mapData = createMapDataResponse(),
  recommendations = createRecommendationsResponse(),
}: DashboardFetchOptions = {}) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)

    if (url.includes('/api/commercial-analysis/map-data')) {
      return Response.json(mapData)
    }

    if (url.includes('/api/recommendations')) {
      return Response.json(recommendations)
    }

    return Response.json({}, { status: 404 })
  })
}

function renderDashboardPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockDashboardFetch()
  })

  it('renders the dashboard with FastAPI CSV data', async () => {
    renderDashboardPage()

    expect(
      screen.getByRole('heading', {
        name: '광주 2호선 상권 변화 대시보드',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('FastAPI CSV 데이터 연결됨')).toBeInTheDocument()
    expect(screen.getByText('분석 역세권')).toBeInTheDocument()
    expect(screen.getByText('74,205개')).toBeInTheDocument()
    expect(screen.getByText('음식점')).toBeInTheDocument()
    expect(screen.getAllByText('상무2동 예정역').length).toBeGreaterThan(0)
    expect(screen.getByTestId('dashboard-data-source-status')).toHaveTextContent(
      '공공 상가 CSV',
    )
    expect(screen.getByTestId('dashboard-data-source-status')).toHaveTextContent(
      '추천 CSV',
    )
    expect(screen.getByText('실제 CSV 기준')).toBeInTheDocument()
    expect(screen.queryByText('125,430명')).not.toBeInTheDocument()
    expect(screen.queryByText('2,845억 원')).not.toBeInTheDocument()
    expect(screen.queryByText('2024.05.18 기준')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-recommendation-map')).toBeInTheDocument()
    expect(screen.getByText('최근 저장한 리포트')).toBeInTheDocument()
  })

  it('does not replace empty CSV recommendation responses with mock rows', async () => {
    mockDashboardFetch({
      recommendations: {
        ...createRecommendationsResponse(),
        items: [],
        map: {
          center: [35.145721, 126.855924],
          route: [],
          zoom: 13,
        },
      },
    })
    renderDashboardPage()

    expect(await screen.findByText('FastAPI CSV 데이터 연결됨')).toBeInTheDocument()
    expect(
      screen.getByText('실제 추천 CSV 응답에 표시할 Top 5 데이터가 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('추천 CSV 지도 데이터가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('상무역')).not.toBeInTheDocument()
    expect(screen.queryByText('첨단역')).not.toBeInTheDocument()
  })

  it('links the sidebar mypage route without separate mypage section shortcuts', () => {
    renderDashboardPage()

    expect(screen.getByRole('link', { name: '마이페이지' })).toHaveAttribute(
      'href',
      '/mypage',
    )
    expect(screen.queryByRole('link', { name: '관심 역세권' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '설정' })).not.toBeInTheDocument()
  })
})
