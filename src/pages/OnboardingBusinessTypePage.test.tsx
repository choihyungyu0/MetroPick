import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { OnboardingBusinessTypePage } from './OnboardingBusinessTypePage'

function renderBusinessTypePage() {
  return render(
    <MemoryRouter>
      <OnboardingBusinessTypePage />
    </MemoryRouter>,
  )
}

describe('OnboardingBusinessTypePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the business type onboarding screen with default selected count', () => {
    renderBusinessTypePage()

    expect(
      screen.getByRole('heading', { level: 1, name: '분석 업종 설정' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 / 3 선택')).toBeInTheDocument()
    expect(screen.getByText('나의 업종 설정')).toBeInTheDocument()
  })

  it('updates selected count when business options are selected and deselected', async () => {
    const user = userEvent.setup()
    renderBusinessTypePage()

    await user.click(screen.getByRole('button', { name: /접근성 중요/ }))

    expect(screen.getByText('3 / 3 선택')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /소비 빈도 높음/ }))

    expect(screen.getByText('2 / 3 선택')).toBeInTheDocument()
  })

  it('saves business setup and navigates to notifications on next', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/onboarding/business-type', element: <OnboardingBusinessTypePage /> },
        { path: '/onboarding/notifications', element: <h1>알림 설정</h1> },
      ],
      { initialEntries: ['/onboarding/business-type'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: /다음: 알림 설정/ }))

    expect(await screen.findByRole('heading', { name: '알림 설정' })).toBeInTheDocument()

    const saved = JSON.parse(
      window.localStorage.getItem('metropick-onboarding-business-types') ?? '{}',
    ) as { selectedBusinessLabels?: string[]; selectedBusinessTypes?: string[] }

    expect(saved.selectedBusinessTypes).toEqual(['cafe-dessert', 'restaurant'])
    expect(saved.selectedBusinessLabels).toEqual(['카페/디저트', '음식점'])
  })

  it('navigates back to station setup from previous button', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/onboarding/business-type', element: <OnboardingBusinessTypePage /> },
        { path: '/onboarding/stations', element: <h1>관심 역세권 설정</h1> },
      ],
      { initialEntries: ['/onboarding/business-type'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: '이전 단계' }))

    expect(
      await screen.findByRole('heading', { name: '관심 역세권 설정' }),
    ).toBeInTheDocument()
  })
})
