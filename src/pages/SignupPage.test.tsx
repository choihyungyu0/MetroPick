import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SignupPage } from './SignupPage'

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  signUpWithEmail: vi.fn(),
}))

vi.mock('@/shared/auth/supabaseAuth', () => ({
  signOut: authMocks.signOut,
  signUpWithEmail: authMocks.signUpWithEmail,
}))

function renderSignupPage() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  )
}

describe('SignupPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    authMocks.signUpWithEmail.mockReset()
    authMocks.signUpWithEmail.mockResolvedValue({
      ok: false,
      reason: 'missing_client',
      message: 'Supabase Auth is not configured.',
    })
    authMocks.signOut.mockReset()
    authMocks.signOut.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('renders signup copy and benefit image icons', () => {
    renderSignupPage()

    expect(screen.getByText('회원가입!')).toBeInTheDocument()
    expect(
      screen.getByText('계정 생성 시 이런 혜택을 누리실 수 있어요!'),
    ).toBeInTheDocument()
    expect(screen.getByText('분석 리포트 저장')).toBeInTheDocument()
    expect(screen.getByAltText('분석 리포트 저장 아이콘')).toBeInTheDocument()
  })

  it('falls back to demo signup when Supabase Auth is not configured', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/signup', element: <SignupPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
      ],
      { initialEntries: ['/signup'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이름'), '데모 사용자')
    await user.type(screen.getByLabelText('이메일'), 'demo@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'demo-password')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'demo-password')
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(
      await screen.findByText('Supabase Auth 미설정 · 데모 회원가입으로 진행합니다.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBe('true')
    const storedUser = JSON.parse(
      window.localStorage.getItem('metropick-user') ?? '{}',
    ) as { source?: string }
    expect(storedUser.source).toBe('demo')
  })

  it('blocks signup when required fields are missing', async () => {
    const user = userEvent.setup()

    renderSignupPage()

    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(
      screen.getByText('이름, 이메일, 비밀번호를 모두 입력해주세요.'),
    ).toBeInTheDocument()
    expect(authMocks.signUpWithEmail).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
  })

  it('blocks signup when password confirmation does not match', async () => {
    const user = userEvent.setup()

    renderSignupPage()

    await user.type(screen.getByLabelText('이름'), '인증 사용자')
    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'different-password')
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(screen.getByText('비밀번호 확인이 일치하지 않습니다.')).toBeInTheDocument()
    expect(authMocks.signUpWithEmail).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
  })

  it('does not continue to demo signup when Supabase rejects the input', async () => {
    const user = userEvent.setup()
    authMocks.signUpWithEmail.mockResolvedValue({
      ok: false,
      reason: 'auth_error',
      message: 'User already registered',
    })
    const router = createMemoryRouter(
      [
        { path: '/signup', element: <SignupPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
      ],
      { initialEntries: ['/signup'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이름'), '인증 사용자')
    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(
      await screen.findByText('이미 가입된 이메일입니다. 로그인으로 진행해주세요.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('초기 설정')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
  })

  it('calls Supabase Auth and creates a profile when configured', async () => {
    const user = userEvent.setup()
    authMocks.signUpWithEmail.mockResolvedValue({
      ok: true,
      session: null,
      user: {
        id: 'auth-user-id',
        email: 'founder@metropick.ai',
        user_metadata: { name: '인증 사용자', role: '예비 창업자' },
      },
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/profiles') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            profile: {
              id: 'profile-id',
              email: 'founder@metropick.ai',
              name: '인증 사용자',
              role: '예비 창업자',
              plan: 'free',
              created_at: '2026-05-16T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchMock)
    const router = createMemoryRouter(
      [
        { path: '/signup', element: <SignupPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
      ],
      { initialEntries: ['/signup'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이름'), '인증 사용자')
    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(authMocks.signUpWithEmail).toHaveBeenCalledWith(
      'founder@metropick.ai',
      'secure-password',
    )
    expect(await screen.findByText('초기 설정')).toBeInTheDocument()

    const profileCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/profiles'),
    )
    expect(profileCall).toBeDefined()
    const body = JSON.parse(String(profileCall?.[1]?.body ?? '{}')) as {
      email?: string
      name?: string
      plan?: string
      role?: string
    }
    expect(body).toMatchObject({
      email: 'founder@metropick.ai',
      name: '인증 사용자',
      role: '예비 창업자',
      plan: 'free',
    })
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

  it('routes returning users to the dashboard after signup', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('metropick-onboarding-completed', 'true')
    window.localStorage.setItem('metropick-onboarding-owner', 'id:auth-user-id')
    authMocks.signUpWithEmail.mockResolvedValue({
      ok: true,
      session: null,
      user: {
        id: 'auth-user-id',
        email: 'founder@metropick.ai',
        user_metadata: { name: '인증 사용자', role: '예비 창업자' },
      },
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/profiles') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            profile: {
              id: 'profile-id',
              email: 'founder@metropick.ai',
              name: '인증 사용자',
              role: '예비 창업자',
              plan: 'free',
              created_at: '2026-05-16T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchMock)
    const router = createMemoryRouter(
      [
        { path: '/signup', element: <SignupPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
        { path: '/dashboard', element: <h1>대시보드</h1> },
      ],
      { initialEntries: ['/signup'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이름'), '인증 사용자')
    await user.type(screen.getByLabelText('이메일'), 'founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(await screen.findByText('대시보드')).toBeInTheDocument()
    expect(screen.queryByText('초기 설정')).not.toBeInTheDocument()
  })

  it('does not reuse onboarding completion from a previous signup user', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('metropick-onboarding-completed', 'true')
    window.localStorage.setItem('metropick-onboarding-owner', 'id:previous-user-id')
    authMocks.signUpWithEmail.mockResolvedValue({
      ok: true,
      session: null,
      user: {
        id: 'new-auth-user-id',
        email: 'new-founder@metropick.ai',
        user_metadata: { name: '새 사용자', role: '예비 창업자' },
      },
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/profiles') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            profile: {
              id: 'profile-id',
              email: 'new-founder@metropick.ai',
              name: '새 사용자',
              role: '예비 창업자',
              plan: 'free',
              created_at: '2026-05-16T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchMock)
    const router = createMemoryRouter(
      [
        { path: '/signup', element: <SignupPage /> },
        { path: '/onboarding', element: <h1>초기 설정</h1> },
        { path: '/dashboard', element: <h1>대시보드</h1> },
      ],
      { initialEntries: ['/signup'] },
    )

    render(<RouterProvider router={router} />)

    await user.type(screen.getByLabelText('이름'), '새 사용자')
    await user.type(screen.getByLabelText('이메일'), 'new-founder@metropick.ai')
    await user.type(screen.getByLabelText('비밀번호'), 'secure-password')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'secure-password')
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(screen.queryByText('대시보드')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-onboarding-completed')).toBeNull()
    expect(window.localStorage.getItem('metropick-onboarding-owner')).toBeNull()
  })
})
