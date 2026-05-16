import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SignupPage } from './SignupPage'

const authMocks = vi.hoisted(() => ({
  signUpWithEmail: vi.fn(),
}))

vi.mock('@/shared/auth/supabaseAuth', () => ({
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

    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(
      await screen.findByText('Supabase Auth 미설정 · 데모 회원가입으로 진행합니다.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('초기 설정')).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBe('true')
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
  })
})
