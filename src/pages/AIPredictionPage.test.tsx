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

function mockPredictionApis({
  failPredictionResult = false,
}: {
  failPredictionResult?: boolean
} = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)

    if (url.includes('/api/prediction/startup-suitability')) {
      return {
        ok: true,
        json: async () => ({
          predicted_score: 83.4,
          risk_level: '낮음',
          recommendation_label: '창업 적합도 높음',
          top_reasons: ['유동 수요 지표가 샘플 기준에서 높게 나타났습니다.'],
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
            station_area: '상무역(2호선)',
            business_type: '커피전문점',
            predicted_score: 83.4,
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

  it('renders the AI prediction layout with the sales forecast chart image', async () => {
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
    expect(screen.getByAltText('개통 전후 매출 전망 예측 차트')).toBeInTheDocument()
    expect(screen.getByText('선택 역세권 예측 요약')).toBeInTheDocument()
    expect(screen.getAllByText('+47.6%').length).toBeGreaterThan(0)
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

  it('saves to prediction-results when backend is available', async () => {
    const user = userEvent.setup()
    const fetchMock = mockPredictionApis()
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      const raw = window.localStorage.getItem('metropick-ai-prediction-results')
      const results = JSON.parse(raw ?? '[]') as Array<{
        backendStartupSuitability?: { predicted_score: number }
        predictedSalesGrowthRate: number
        predicted_score?: number
      }>

      expect(results[0]).toMatchObject({
        id: 'backend-prediction-result',
        predictedSalesGrowthRate: 47.6,
        predicted_score: 83.4,
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
        predictedSalesGrowthRate?: number
        scenario?: string
      }
      station_area?: string
    }
    expect(body).toMatchObject({
      station_area: '상무역(2호선)',
      business_type: '커피전문점',
      predicted_score: 83.4,
    })
    expect(body.result_payload).toMatchObject({
      predictedSalesGrowthRate: 47.6,
      backendStartupSuitability: { predicted_score: 83.4 },
      scenario: '광주 2호선 2단계 개통 - 2026년 예정',
    })

    expect(
      screen.getByText('Supabase에 AI 예측 결과를 저장했어요.'),
    ).toBeInTheDocument()
    expect(screen.getByText('FastAPI 예측 결과 연결됨')).toBeInTheDocument()
    expect(screen.getByText('창업 적합도 점수')).toBeInTheDocument()
    expect(screen.getByText('83.4점')).toBeInTheDocument()
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
