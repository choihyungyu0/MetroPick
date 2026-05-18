import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIPredictionPage } from './AIPredictionPage'

function renderAIPredictionPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AIPredictionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

type MockMonthlySalesSeriesItem = {
  after_opening_value: number | null
  before_opening_value: number | null
  label: string
}

function buildMockMonthlySalesSeries(
  score: number,
  predictedSalesChangeRate: number,
): MockMonthlySalesSeriesItem[] {
  const openingValue = Math.round((1450 + score * 8) / 10) * 10
  const targetValue = Math.round((openingValue * (1 + predictedSalesChangeRate / 100)) / 10) * 10
  const lift = targetValue - openingValue

  return [
    {
      label: '-12개월',
      before_opening_value: openingValue - 260,
      after_opening_value: null,
    },
    {
      label: '-6개월',
      before_opening_value: openingValue - 130,
      after_opening_value: null,
    },
    {
      label: '개통 시점',
      before_opening_value: openingValue,
      after_opening_value: openingValue,
    },
    {
      label: '+6개월',
      before_opening_value: null,
      after_opening_value: Math.round((openingValue + lift * 0.34) / 10) * 10,
    },
    {
      label: '+12개월',
      before_opening_value: null,
      after_opening_value: Math.round((openingValue + lift * 0.58) / 10) * 10,
    },
    {
      label: '+18개월',
      before_opening_value: null,
      after_opening_value: Math.round((openingValue + lift * 0.8) / 10) * 10,
    },
    {
      label: '+24개월',
      before_opening_value: null,
      after_opening_value: targetValue,
    },
  ]
}

function mockPredictionApis({
  failPredictionResult = false,
  omitMonthlySalesSeries = false,
}: {
  failPredictionResult?: boolean
  omitMonthlySalesSeries?: boolean
} = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)

    if (url.includes('/api/recommendations')) {
      return {
        ok: true,
        json: async () => ({
          data_status: 'recommendation_csv',
          message: '로컬 추천 Top 5 CSV 기반 결과입니다.',
          items: [
            {
              station_id: '2호선_215',
              station_name: '2호선_215',
              display_station_name: '서남동 예정역',
              recommendation_label: '추가 검토',
              startup_suitability_score: 72.8,
              floating_demand_index: 79.2,
              competition_index: 50,
              business_diversity_index: 76,
              data_status: 'recommendation_csv',
            },
          ],
        }),
      } satisfies Pick<Response, 'json' | 'ok'>
    }

    if (url.includes('/api/prediction/simulate')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as {
        business_type?: string
        station_id?: string
        station_name?: string
      }
      const stationName = body.station_name ?? body.station_id ?? '상무역'
      const businessType = body.business_type ?? '커피전문점'
      const displayStationName = stationName === '2호선_215'
        ? '서남동 예정역'
        : stationName.includes('첨단')
        ? '첨단지구역'
        : stationName
      const stationScore = stationName === '2호선_215'
        ? 72
        : stationName.includes('백운')
        ? 74.2
        : stationName.includes('첨단')
          ? 58.6
          : stationName.includes('시청')
            ? 61.4
            : 83.4
      const businessAdjustment = businessType.includes('편의')
        ? -6.2
        : businessType.includes('음식') || businessType.includes('외식')
          ? 4.7
          : 0
      const score = Math.round((stationScore + businessAdjustment) * 10) / 10
      const predictedGrowthRate = Math.round((score * 0.52) * 10) / 10
      const predictedSalesChangeRate = Math.round((score * 0.41) * 10) / 10

      return {
        ok: true,
        json: async () => ({
          data_status: 'ml_model',
          station_id: body.station_id ?? stationName,
          station_name: stationName,
          display_station_name: displayStationName,
          business_type: businessType,
          scenario: '광주 2호선 2단계 개통 - 2026년 예정',
          radius_m: 500,
          startup_suitability_score: score,
          predicted_score: score,
          predicted_growth_rate: predictedGrowthRate,
          predicted_sales_change_rate: predictedSalesChangeRate,
          ...(omitMonthlySalesSeries
            ? {}
            : {
                monthly_sales_series: buildMockMonthlySalesSeries(
                  score,
                  predictedSalesChangeRate,
                ),
              }),
          floating_demand_index: Math.round((score * 0.8) * 10) / 10,
          competition_index: businessType.includes('편의') ? 68.2 : 42.1,
          business_diversity_index: 76.4,
          risk_level: score >= 75 ? '낮음' : score >= 55 ? '보통' : '높음',
          recommendation_label: '창업 적합도 높음',
          risk_factors: [`${businessType} 동종 점포 비중을 반영했습니다.`],
          strategy_comment: `${displayStationName} ${businessType} 전략 코멘트입니다.`,
          confidence_metrics: [
            { label: '종합 예측 신뢰도', score: 82, level: '높음' },
            { label: '데이터 기반 신뢰도', score: 79, level: '높음' },
            { label: '모델 점검 수준', score: 78, level: '높음' },
            { label: '유사 상권 적합도', score: 76, level: '높음' },
          ],
        }),
      } satisfies Pick<Response, 'json' | 'ok'>
    }

    if (url.includes('/api/prediction-results') && init?.method === 'POST') {
      if (failPredictionResult) {
        throw new Error('prediction result save failed')
      }

      return {
        ok: true,
        json: async () => ({
          data_status: 'supabase_connected',
          result: {
            id: 'backend-prediction-result',
            station_area: JSON.parse(String(init.body ?? '{}')).station_area,
            business_type: JSON.parse(String(init.body ?? '{}')).business_type,
            predicted_score: JSON.parse(String(init.body ?? '{}')).predicted_score,
            result_payload: JSON.parse(String(init.body ?? '{}')).result_payload,
            created_at: '2026-05-15T00:00:00+00:00',
          },
        }),
      } satisfies Pick<Response, 'json' | 'ok'>
    }

    throw new Error('offline')
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('AIPredictionPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('renders the AI prediction layout with a dynamic sales forecast chart', async () => {
    renderAIPredictionPage()

    expect(
      screen.getByRole('heading', { name: /AI 매출 변동 시뮬레이션/ }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole(
        'button',
        { name: '리포트 다운로드' },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: '상무역 커피전문점 개통 전후 매출 전망 차트',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByAltText('개통 전후 매출 전망 예측 차트')).not.toBeInTheDocument()
    expect(screen.getByText('선택 역세권 예측 요약')).toBeInTheDocument()
    expect(screen.getAllByText('+47.6%').length).toBeGreaterThan(0)
  })

  it('renders chart labels from a successful ml_model monthly sales series', async () => {
    const user = userEvent.setup()
    mockPredictionApis()
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      expect(screen.getAllByText('-12개월').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('개통 시점').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+24개월').length).toBeGreaterThan(0)
    expect(screen.getAllByText('개통 전').length).toBeGreaterThan(0)
    expect(screen.getAllByText('개통 후').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+34.2%').length).toBeGreaterThan(0)
  })

  it('updates the chart percentage when the prediction response changes', async () => {
    const user = userEvent.setup()
    mockPredictionApis()
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))
    await waitFor(() => {
      expect(screen.getAllByText('+34.2%').length).toBeGreaterThan(0)
    })

    await user.selectOptions(screen.getByLabelText('업종 선택'), '편의점')
    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      expect(screen.getAllByText('+31.7%').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('+34.2%')).not.toBeInTheDocument()
  })

  it('renders a fallback chart when monthly_sales_series is missing', async () => {
    const user = userEvent.setup()
    mockPredictionApis({ omitMonthlySalesSeries: true })
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      expect(screen.getAllByText('-6개월').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('+24개월').length).toBeGreaterThan(0)
    expect(screen.queryByAltText('개통 전후 매출 전망 예측 차트')).not.toBeInTheDocument()
  })

  it('saves a fallback simulation result to localStorage', async () => {
    const user = userEvent.setup()
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      expect(window.localStorage.getItem('metropick-ai-prediction-results')).not.toBeNull()
    })

    const raw = window.localStorage.getItem('metropick-ai-prediction-results')
    const results = JSON.parse(raw ?? '[]') as Array<{
      predictedSalesGrowthRate: number
      predictedSalesIncrease: string
      riskLevel: string
    }>

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      predictedSalesGrowthRate: 47.6,
      predictedSalesIncrease: '+1,280만원',
      riskLevel: '보통',
    })
    expect(
      screen.getByText('백엔드 미연결 · 로컬에 AI 예측 결과를 저장했어요.'),
    ).toBeInTheDocument()
  })

  it('clicking simulation sends the selected station and business type', async () => {
    const user = userEvent.setup()
    const fetchMock = mockPredictionApis()
    renderAIPredictionPage()

    await user.selectOptions(screen.getByLabelText('역세권 선택'), '백운광장역')
    await user.selectOptions(screen.getByLabelText('업종 선택'), '외식업')
    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes('/api/prediction/simulate'),
        ),
      ).toBe(true)
    })

    const simulationCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/prediction/simulate'),
    )
    const body = JSON.parse(String(simulationCall?.[1]?.body ?? '{}')) as {
      business_type?: string
      radius_m?: number
      station_name?: string
    }
    expect(body).toMatchObject({
      station_name: '백운광장역',
      business_type: '외식업',
      radius_m: 500,
    })
  })

  it('sends a matchable internal station when selecting a display station name', async () => {
    const user = userEvent.setup()
    const fetchMock = mockPredictionApis()
    renderAIPredictionPage()

    await screen.findByRole('option', { name: '서남동 예정역' })
    await user.selectOptions(screen.getByLabelText('역세권 선택'), '서남동 예정역')
    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      expect(screen.getByText('72.0점')).toBeInTheDocument()
    })

    const simulationCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/prediction/simulate'),
    )
    const simulationBody = JSON.parse(String(simulationCall?.[1]?.body ?? '{}')) as {
      station_id?: string
      station_name?: string
    }
    expect(simulationBody).toMatchObject({
      station_id: '2호선_215',
      station_name: '2호선_215',
    })

    const saveCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/prediction-results'),
    )
    const saveBody = JSON.parse(String(saveCall?.[1]?.body ?? '{}')) as {
      result_payload?: { title?: string }
      station_area?: string
    }
    expect(saveBody).toMatchObject({
      station_area: '서남동 예정역',
      result_payload: {
        title: '서남동 예정역 커피전문점 AI 예측 결과',
      },
    })
    expect(screen.getAllByText('서남동 예정역').length).toBeGreaterThan(0)
    expect(
      screen.getByText('커피전문점 동종 점포 비중을 반영했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('+37.4%').length).toBeGreaterThan(0)
  })

  it('changing station changes the simulation request payload', async () => {
    const user = userEvent.setup()
    const fetchMock = mockPredictionApis()
    renderAIPredictionPage()

    await user.selectOptions(screen.getByLabelText('역세권 선택'), '시청역')
    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          String(input).includes('/api/prediction/simulate'),
        ),
      ).toHaveLength(1)
    })

    await user.selectOptions(screen.getByLabelText('역세권 선택'), '첨단역')
    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          String(input).includes('/api/prediction/simulate'),
        ),
      ).toHaveLength(2)
    })

    const stationNames = fetchMock.mock.calls
      .filter(([input]) => String(input).includes('/api/prediction/simulate'))
      .map(([, init]) => {
        const body = JSON.parse(String(init?.body ?? '{}')) as { station_name?: string }
        return body.station_name
      })
    expect(stationNames).toEqual(['시청역', '첨단역'])
  })

  it('changing business type changes the simulation request payload', async () => {
    const user = userEvent.setup()
    const fetchMock = mockPredictionApis()
    renderAIPredictionPage()

    await user.selectOptions(screen.getByLabelText('업종 선택'), '편의점')
    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes('/api/prediction/simulate'),
        ),
      ).toBe(true)
    })

    const simulationCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/prediction/simulate'),
    )
    const body = JSON.parse(String(simulationCall?.[1]?.body ?? '{}')) as {
      business_type?: string
    }
    expect(body.business_type).toBe('편의점')
  })

  it('saves to prediction-results when backend is available', async () => {
    const user = userEvent.setup()
    const fetchMock = mockPredictionApis()
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      const raw = window.localStorage.getItem('metropick-ai-prediction-results')
      const results = JSON.parse(raw ?? '[]') as Array<{
        backendStartupSuitability?: { predicted_score: number }
        predictedSalesIncrease?: string
        predictedSalesGrowthRate: number
        predicted_score?: number
        strategyComment?: string
      }>

      expect(results[0]).toMatchObject({
        id: 'backend-prediction-result',
        predictedSalesGrowthRate: 43.4,
        predictedSalesIncrease: '+34.2%',
        predicted_score: 83.4,
        strategyComment: '상무역 커피전문점 전략 코멘트입니다.',
        backendStartupSuitability: {
          predicted_score: 83.4,
        },
      })
    })

    const saveCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/prediction-results'),
    )
    expect(saveCall).toBeDefined()

    const body = JSON.parse(String(saveCall?.[1]?.body ?? '{}')) as {
      business_type?: string
      predicted_score?: number
      result_payload?: {
        backendStartupSuitability?: { predicted_score?: number }
        growth_rate?: number
        predictedSalesGrowthRate?: number
        sales_change_rate?: number
        scenario?: string
        strategy_comment?: string
        title?: string
      }
      station_area?: string
    }
    expect(body).toMatchObject({
      station_area: '상무역',
      business_type: '커피전문점',
      predicted_score: 83.4,
    })
    expect(body.result_payload).toMatchObject({
      title: '상무역 커피전문점 AI 예측 결과',
      predictedSalesGrowthRate: 43.4,
      growth_rate: 43.4,
      sales_change_rate: 34.2,
      strategy_comment: '상무역 커피전문점 전략 코멘트입니다.',
      backendStartupSuitability: { predicted_score: 83.4 },
      scenario: '광주 2호선 2단계 개통 - 2026년 예정',
    })

    expect(
      screen.getByText('Supabase에 AI 예측 결과를 저장했어요.'),
    ).toBeInTheDocument()
    expect(screen.getByText('FastAPI ML 예측 결과 연결됨')).toBeInTheDocument()
    expect(screen.getByText('창업 적합도 점수')).toBeInTheDocument()
    expect(screen.getByText('83.4점')).toBeInTheDocument()
    expect(screen.getByText('상무역 커피전문점 전략 코멘트입니다.')).toBeInTheDocument()
    expect(screen.queryByText('백엔드 미연결 · 목업 예측 결과 표시')).not.toBeInTheDocument()
  })

  it('falls back to localStorage when prediction result save fails', async () => {
    const user = userEvent.setup()
    mockPredictionApis({ failPredictionResult: true })
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      const raw = window.localStorage.getItem('metropick-ai-prediction-results')
      const results = JSON.parse(raw ?? '[]') as Array<{
        backendStartupSuitability?: { predicted_score: number }
        predicted_score?: number
      }>

      expect(results[0]).toMatchObject({
        predicted_score: 83.4,
        backendStartupSuitability: {
          predicted_score: 83.4,
        },
      })
    })

    expect(
      screen.getByText('백엔드 미연결 · 로컬에 AI 예측 결과를 저장했어요.'),
    ).toBeInTheDocument()
  })
})
