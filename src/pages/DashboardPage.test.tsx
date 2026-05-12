import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { DashboardPage } from './DashboardPage'

function renderDashboardPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the dashboard content and central map asset', () => {
    renderDashboardPage()

    expect(
      screen.getByRole('heading', {
        name: '광주 2호선 상권 변화 대시보드',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('유동인구 예측')).toBeInTheDocument()
    expect(screen.getByAltText('광주 2호선 상권 변화 지도')).toBeInTheDocument()
    expect(screen.getByText('상무역')).toBeInTheDocument()
    expect(screen.getByText('최근 저장한 리포트')).toBeInTheDocument()
  })

  it('uses the consolidated mypage sidebar link', () => {
    renderDashboardPage()

    expect(screen.getByRole('link', { name: '마이페이지' })).toHaveAttribute(
      'href',
      '/mypage',
    )
    expect(screen.queryByRole('link', { name: '관심 지역' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '설정' })).not.toBeInTheDocument()
  })
})
