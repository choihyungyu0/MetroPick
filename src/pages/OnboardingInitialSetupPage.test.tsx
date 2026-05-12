import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { OnboardingInitialSetupPage } from './OnboardingInitialSetupPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <OnboardingInitialSetupPage />
    </MemoryRouter>,
  )
}

describe('OnboardingInitialSetupPage', () => {
  it('renders the initial setup screen', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '초기 설정' })).toBeInTheDocument()
    expect(screen.getByText('관심 지역 선택')).toBeInTheDocument()
    expect(screen.getByText('나의 설정 요약')).toBeInTheDocument()
  })
})
