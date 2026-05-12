import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LandingPage } from './LandingPage'

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('renders the landing hero and primary feature card', () => {
    renderLandingPage()

    expect(screen.getByText(/광주 2호선 개통 이후/)).toBeInTheDocument()
    expect(screen.getAllByText('MetroPick AI').length).toBeGreaterThan(0)
    expect(screen.getByText('광주 2호선 상권 변화 대시보드')).toBeInTheDocument()
    expect(screen.getByText('신뢰할 수 있는 공공데이터 기반')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '역세권 상권 분석 매핑' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('광주 2호선 상권 변화 예측 지도')).toBeInTheDocument()
    expect(screen.getByAltText('매출 잠재력 변화 예측 차트')).toBeInTheDocument()
    expect(screen.getByAltText('공공데이터포털 로고')).toBeInTheDocument()
  })
})
