import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { OnboardingStationPage } from './OnboardingStationPage'

function renderOnboardingStationPage() {
  return render(
    <MemoryRouter>
      <OnboardingStationPage />
    </MemoryRouter>,
  )
}

describe('OnboardingStationPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the station onboarding screen with default selected count', () => {
    renderOnboardingStationPage()

    expect(
      screen.getByRole('heading', { level: 1, name: '관심 역세권 설정' }),
    ).toBeInTheDocument()
    expect(screen.getByText('4 / 5 선택')).toBeInTheDocument()
  })

  it('updates selected station count when a station is selected', async () => {
    const user = userEvent.setup()
    renderOnboardingStationPage()

    await user.click(screen.getByRole('button', { name: /운천역/ }))

    expect(screen.getByText('5 / 5 선택')).toBeInTheDocument()
  })

  it('updates the summary when radius changes', async () => {
    const user = userEvent.setup()
    renderOnboardingStationPage()

    await user.click(screen.getByRole('button', { name: '1km' }))

    expect(screen.getByText('4개 역세권 / 반경 1km')).toBeInTheDocument()
  })
})
