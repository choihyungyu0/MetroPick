import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { MyPage } from './MyPage'

function renderMyPage() {
  return render(
    <MemoryRouter>
      <MyPage />
    </MemoryRouter>,
  )
}

describe('MyPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the profile and saved reports', () => {
    renderMyPage()

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByText('저장한 리포트')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('상무역 상권 분석 리포트')).toBeInTheDocument()
  })

  it('shows interest locations from the tab panel', async () => {
    const user = userEvent.setup()
    renderMyPage()

    await user.click(screen.getByRole('tab', { name: '관심 역세권' }))

    expect(screen.getByText('백운광장역')).toBeInTheDocument()
    expect(screen.getByText('남구 백운동 · 카페/커피전문점')).toBeInTheDocument()
  })

  it('opens a mypage tab from the query parameter', () => {
    render(
      <MemoryRouter initialEntries={['/mypage?tab=interest-locations']}>
        <MyPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('tab', { name: '관심 역세권' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('백운광장역')).toBeInTheDocument()
  })

  it('shows notification settings and saves them to localStorage', async () => {
    const user = userEvent.setup()
    renderMyPage()

    await user.click(screen.getByRole('tab', { name: '알림 설정' }))
    await user.click(screen.getByRole('button', { name: '문자' }))
    await user.click(screen.getByRole('button', { name: '알림 설정 저장' }))

    expect(screen.getByText('알림 설정이 저장되었습니다.')).toBeInTheDocument()

    const raw = window.localStorage.getItem('metropick-onboarding-notifications')
    expect(raw).not.toBeNull()
    const settings = JSON.parse(raw ?? '{}') as {
      channels?: { sms?: boolean }
    }
    expect(settings.channels?.sms).toBe(true)
  })

  it('filters the saved report list by search query', async () => {
    const user = userEvent.setup()
    renderMyPage()

    await user.type(
      screen.getByPlaceholderText('리포트 제목, 역세권, 업종 검색'),
      '쌍촌',
    )

    expect(screen.getByText('쌍촌역 매출 예측 리포트')).toBeInTheDocument()
    expect(screen.queryByText('상무역 상권 분석 리포트')).not.toBeInTheDocument()
  })

  it('shows copy feedback when sharing a report', async () => {
    const user = userEvent.setup()
    renderMyPage()

    const [shareButton] = screen.getAllByRole('button', { name: '공유' })
    expect(shareButton).toBeDefined()
    await user.click(shareButton!)

    expect(screen.getByText('리포트 링크가 복사되었습니다.')).toBeInTheDocument()
  })
})
