import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SignupPage } from './SignupPage'

function renderSignupPage() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  )
}

describe('SignupPage', () => {
  it('renders signup copy and benefit image icons', () => {
    renderSignupPage()

    expect(screen.getByText('회원가입!')).toBeInTheDocument()
    expect(
      screen.getByText('계정 생성 시 이런 혜택을 누리실 수 있어요!'),
    ).toBeInTheDocument()
    expect(screen.getByText('분석 리포트 저장')).toBeInTheDocument()
    expect(screen.getByAltText('분석 리포트 저장 아이콘')).toBeInTheDocument()
  })

  it('navigates to onboarding after mock signup success', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/signup', element: <SignupPage /> },
        { path: '/onboarding/stations', element: <h1>관심 역세권 설정</h1> },
      ],
      { initialEntries: ['/signup'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(await screen.findByText('관심 역세권 설정')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBe('true')
  })
})
