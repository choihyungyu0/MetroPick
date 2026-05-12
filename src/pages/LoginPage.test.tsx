import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LoginPage } from './LoginPage'

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the login page copy and preview image', () => {
    renderLoginPage()

    expect(screen.getAllByText('로그인').length).toBeGreaterThan(0)
    expect(screen.getByText(/데이터로 먼저 보는/)).toBeInTheDocument()
    expect(screen.getByText('광주 상권의 미래')).toBeInTheDocument()
    expect(
      screen.getByAltText('광주 2호선 예상 상권 변화 지도 미리보기'),
    ).toBeInTheDocument()
  })

  it('navigates to onboarding after mock login success', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBe('true')
  })
})
