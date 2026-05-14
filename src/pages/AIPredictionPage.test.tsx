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

describe('AIPredictionPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('renders the AI prediction layout with the sales forecast chart image', () => {
    const { container } = renderAIPredictionPage()

    expect(container.querySelector('.ai-prediction-page')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeInTheDocument()
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
    }>

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      predictedSalesGrowthRate: 47.6,
    })
  })

  it('saves a FastAPI prediction result to localStorage when available', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          predicted_score: 83.4,
          risk_level: '낮음',
          recommendation_label: '창업 적합도 높음',
          top_reasons: ['유동 수요 지표가 샘플 기준에서 높게 나타났습니다.'],
        }),
      } satisfies Pick<Response, 'json' | 'ok'>),
    )
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    await waitFor(() => {
      const raw = window.localStorage.getItem('metropick-ai-prediction-results')
      const results = JSON.parse(raw ?? '[]') as Array<{
        predicted_score?: number
        recommendation_label?: string
        risk_level?: string
      }>

      expect(results[0]).toMatchObject({
        predicted_score: 83.4,
        recommendation_label: '창업 적합도 높음',
        risk_level: '낮음',
      })
    })
    expect(screen.getByText('FastAPI 예측 결과 연결됨')).toBeInTheDocument()
  })
})
