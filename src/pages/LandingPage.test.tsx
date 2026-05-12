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
    expect(
      screen.getByRole('heading', { name: '역세권 상권 분석 매핑' }),
    ).toBeInTheDocument()
  })
})
