import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { AIPredictionPage } from './AIPredictionPage'

function renderAIPredictionPage() {
  return render(
    <MemoryRouter>
      <AIPredictionPage />
    </MemoryRouter>,
  )
}

describe('AIPredictionPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the AI prediction layout with the sales forecast chart image', () => {
    renderAIPredictionPage()

    expect(
      screen.getByRole('heading', { name: /AI 매출 변동 시뮬레이션/ }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('개통 전후 매출 전망 예측 차트')).toBeInTheDocument()
    expect(screen.getByText('선택 역세권 예측 요약')).toBeInTheDocument()
    expect(screen.getAllByText('+47.6%').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByText('AI 예측')
        .some((item) => item.getAttribute('aria-current') === 'page'),
    ).toBe(true)
  })

  it('saves a simulation result to localStorage', async () => {
    const user = userEvent.setup()
    renderAIPredictionPage()

    await user.click(screen.getByRole('button', { name: '시뮬레이션 실행' }))

    const raw = window.localStorage.getItem('metropick-ai-prediction-results')
    expect(raw).not.toBeNull()

    const results = JSON.parse(raw ?? '[]') as Array<{
      predictedSalesGrowthRate: number
      stationArea: string
    }>
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      predictedSalesGrowthRate: 47.6,
      stationArea: '상무역 (2호선)',
    })
    expect(screen.getByText('시뮬레이션 결과가 저장되었습니다.')).toBeInTheDocument()
  })
})
