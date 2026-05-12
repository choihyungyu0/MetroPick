import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { DashboardPage } from './DashboardPage'

describe('DashboardPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the dashboard content and central map asset', () => {
    render(<DashboardPage />)

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
})
