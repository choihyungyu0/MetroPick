import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from './LoginPage'

const authMocks = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
}))

vi.mock('@/shared/auth/supabaseAuth', () => ({
  signInWithEmail: authMocks.signInWithEmail,
}))

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    authMocks.signInWithEmail.mockReset()
    authMocks.signInWithEmail.mockResolvedValue({
      ok: false,
      reason: 'missing_client',
      message: 'Supabase Auth is not configured.',
    })
  })

  it('renders the login page copy and preview image', () => {
    renderLoginPage()

    expect(screen.getAllByText('로그인').length).toBeGreaterThan(0)
    expect(screen.getByText(/데이터로 먼저 보는/)).toBeInTheDocument()
    expect(screen.getByText('광주 상권의 미래')).toBeInTheDocument()
    expect(
      screen.getByAltText('광주 2호선 예상 상권 변화 지도 미리보기'),
    ).toBeInTheDocument()
  })

  it('falls back to demo login when Supabase Auth is not configured', async () => {
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

    expect(
      await screen.findByText('Supabase Auth 미설정 · 데모 로그인으로 진행합니다.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBe('true')
    const storedUser = JSON.parse(
      window.localStorage.getItem('metropick-user') ?? '{}',
    ) as { source?: string }
    expect(storedUser.source).toBe('demo')
  })

  it('calls Supabase Auth and stores the signed-in user when configured', async () => {
    const user = userEvent.setup()
    authMocks.signInWithEmail.mockResolvedValue({
      ok: true,
      session: null,
      user: {
        id: 'auth-user-id',
        email: 'founder@metropick.ai',
        user_metadata: { name: '인증 사용자', role: '예비 창업자' },
      },
    })
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(authMocks.signInWithEmail).toHaveBeenCalledWith(
      'founder@metropick.ai',
      'secure-password',
    )
    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBe('true')
    const storedUser = JSON.parse(
      window.localStorage.getItem('metropick-user') ?? '{}',
    ) as { email?: string; id?: string; source?: string }
    expect(storedUser).toMatchObject({
      email: 'founder@metropick.ai',
      id: 'auth-user-id',
      source: 'supabase',
    })
  })
})
