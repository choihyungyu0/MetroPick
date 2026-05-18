import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from './LoginPage'

const authMocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  signInWithEmail: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/shared/auth/supabaseAuth', () => ({
  getCurrentSession: authMocks.getCurrentSession,
  signInWithEmail: authMocks.signInWithEmail,
  signOut: authMocks.signOut,
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
    authMocks.getCurrentSession.mockReset()
    authMocks.getCurrentSession.mockResolvedValue({ ok: true, session: null })
    authMocks.signOut.mockReset()
    authMocks.signOut.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
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

    await user.type(screen.getByLabelText('이메일'), 'demo@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'demo-password')
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

  it('blocks login when required fields are missing', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('이메일과 비밀번호를 모두 입력해주세요.')).toBeInTheDocument()
    expect(authMocks.signInWithEmail).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
  })

  it('does not continue to demo login when Supabase rejects credentials', async () => {
    const user = userEvent.setup()
    authMocks.signInWithEmail.mockResolvedValue({
      ok: false,
      reason: 'auth_error',
      message: 'Invalid login credentials',
    })
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이메일'), 'missing@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('이메일 또는 비밀번호를 확인해주세요.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('초기 설정')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
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

  it('routes returning users to the dashboard after login', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('metropick-onboarding-completed', 'true')
    window.localStorage.setItem('metropick-onboarding-owner', 'id:auth-user-id')
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
        { path: '/dashboard', element: <h1>대시보드</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('대시보드')).toBeInTheDocument()
    expect(screen.queryByText('초기 설정')).not.toBeInTheDocument()
  })

  it('keeps same-user local onboarding fallback when backend has no settings after login', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('metropick-onboarding-completed', 'true')
    window.localStorage.setItem('metropick-onboarding-owner', 'id:auth-user-id')
    authMocks.signInWithEmail.mockResolvedValue({
      ok: true,
      session: null,
      user: {
        id: 'auth-user-id',
        email: 'founder@metropick.ai',
        user_metadata: { name: '인증 사용자', role: '예비 창업자' },
      },
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/onboarding-settings')) {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            settings: [],
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchMock)
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
        { path: '/dashboard', element: <h1>대시보드</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('대시보드')).toBeInTheDocument()
    expect(screen.queryByText('초기 설정')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/onboarding-settings?user_id=auth-user-id',
      expect.objectContaining({}),
    )
    expect(window.localStorage.getItem('metropick-onboarding-completed')).toBe(
      'true',
    )
  })

  it('routes users with backend onboarding settings to the dashboard', async () => {
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
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)

        if (url.includes('/api/onboarding-settings')) {
          return {
            ok: true,
            json: async () => ({
              data_status: 'supabase_connected',
              settings: [
                {
                  id: 'setting-id',
                  selected_stations: ['상무역'],
                  selected_business_types: ['카페/디저트'],
                  created_at: '2026-05-16T00:00:00+00:00',
                },
              ],
            }),
          } satisfies Pick<Response, 'json' | 'ok'>
        }

        throw new Error('offline')
      }),
    )
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
        { path: '/dashboard', element: <h1>대시보드</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('대시보드')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-onboarding-owner')).toBe(
      'id:auth-user-id',
    )
  })

  it('does not reuse onboarding completion from a different stored user', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('metropick-onboarding-completed', 'true')
    window.localStorage.setItem('metropick-onboarding-owner', 'id:previous-user-id')
    authMocks.signInWithEmail.mockResolvedValue({
      ok: true,
      session: null,
      user: {
        id: 'new-auth-user-id',
        email: 'new-founder@metropick.ai',
        user_metadata: { name: '새 사용자', role: '예비 창업자' },
      },
    })
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
        { path: '/dashboard', element: <h1>대시보드</h1> },
      ],
      { initialEntries: ['/login'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이메일'), 'new-founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(screen.queryByText('대시보드')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-onboarding-completed')).toBeNull()
    expect(window.localStorage.getItem('metropick-onboarding-owner')).toBeNull()
  })
})
