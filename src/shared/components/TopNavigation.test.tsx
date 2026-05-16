import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { saveAuthUser } from '@/shared/auth/authStorage'
import { TopNavigation } from './TopNavigation'

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}))

vi.mock('@/shared/auth/supabaseAuth', () => ({
  signOut: authMocks.signOut,
}))

function renderAuthenticatedNavigation() {
  saveAuthUser({
    email: 'founder@metropick.ai',
    id: 'auth-user-id',
    name: '인증 사용자',
    role: '예비 창업자',
    source: 'supabase',
  })

  return render(
    <MemoryRouter initialEntries={['/mypage']}>
      <Routes>
        <Route element={<TopNavigation />} path="/mypage" />
        <Route element={<h1>로그인</h1>} path="/login" />
      </Routes>
    </MemoryRouter>,
  )
}

function renderUnauthenticatedNavigation(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<TopNavigation />} path="/" />
        <Route element={<h1>로그인</h1>} path="/login" />
        <Route element={<h1>회원가입</h1>} path="/signup" />
        <Route element={<h1>상권 분석</h1>} path="/commercial-analysis" />
        <Route element={<h1>초기 설정</h1>} path="/onboarding" />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopNavigation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    authMocks.signOut.mockReset()
    authMocks.signOut.mockResolvedValue({ ok: true })
  })

  it('shows a logout button for authenticated users and clears auth on click', async () => {
    const user = userEvent.setup()

    renderAuthenticatedNavigation()

    const logoutButton = screen.getAllByRole('button', { name: '로그아웃' }).at(0)
    if (!logoutButton) {
      throw new Error('Logout button was not rendered.')
    }

    await user.click(logoutButton)

    expect(authMocks.signOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
    })
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('routes unauthenticated protected navigation clicks to login', async () => {
    const user = userEvent.setup()

    renderUnauthenticatedNavigation()

    const protectedLink = screen.getAllByRole('link', { name: '상권 분석' }).at(0)
    if (!protectedLink) {
      throw new Error('Protected navigation link was not rendered.')
    }

    await user.click(protectedLink)

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '상권 분석' })).not.toBeInTheDocument()
  })

  it('routes the free start action to signup without creating a demo session', async () => {
    const user = userEvent.setup()

    renderUnauthenticatedNavigation()

    const startLink = screen.getAllByRole('link', { name: '무료로 시작하기' }).at(0)
    if (!startLink) {
      throw new Error('Free start link was not rendered.')
    }

    await user.click(startLink)

    expect(await screen.findByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(window.localStorage.getItem('metropick-authenticated')).toBeNull()
    expect(window.localStorage.getItem('metropick-user')).toBeNull()
  })
})
