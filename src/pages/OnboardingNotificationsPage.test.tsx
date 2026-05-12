import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { OnboardingNotificationsPage } from './OnboardingNotificationsPage'

function renderNotificationsPage() {
  return render(
    <MemoryRouter>
      <OnboardingNotificationsPage />
    </MemoryRouter>,
  )
}

describe('OnboardingNotificationsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the notification onboarding screen with default summary', () => {
    renderNotificationsPage()

    expect(
      screen.getByRole('heading', { level: 1, name: '알림 설정' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('알림 설정').length).toBeGreaterThan(1)

    const summary = screen.getByLabelText('알림 설정 요약')

    expect(within(summary).getByText('5개 항목 활성화')).toBeInTheDocument()
    expect(within(summary).getByText('이메일')).toBeInTheDocument()
    expect(within(summary).getByText('웹 푸시')).toBeInTheDocument()
    expect(within(summary).getByText('실시간')).toBeInTheDocument()
  })

  it('updates active notification count when a toggle changes', async () => {
    const user = userEvent.setup()
    renderNotificationsPage()

    await user.click(screen.getByRole('button', { name: '개통 일정 변경 알림 끄기' }))

    expect(
      within(screen.getByLabelText('알림 설정 요약')).getByText('4개 항목 활성화'),
    ).toBeInTheDocument()
  })

  it('updates channels and frequency selections in the summary', async () => {
    const user = userEvent.setup()
    renderNotificationsPage()

    await user.click(screen.getByRole('button', { name: /SMS로 알림을 받아보세요/ }))
    await user.click(screen.getByRole('button', { name: '매주' }))

    const summary = screen.getByLabelText('알림 설정 요약')

    expect(within(summary).getByText('문자')).toBeInTheDocument()
    expect(within(summary).getByText('매주')).toBeInTheDocument()
  })

  it('navigates back to business type setup from previous button', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/onboarding/notifications', element: <OnboardingNotificationsPage /> },
        { path: '/onboarding/business-type', element: <h1>분석 업종 설정</h1> },
      ],
      { initialEntries: ['/onboarding/notifications'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: '이전 단계' }))

    expect(await screen.findByText('분석 업종 설정')).toBeInTheDocument()
  })

  it('saves final onboarding state and navigates to dashboard', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        { path: '/onboarding/notifications', element: <OnboardingNotificationsPage /> },
        { path: '/dashboard', element: <h1>MetroPick AI 대시보드</h1> },
      ],
      { initialEntries: ['/onboarding/notifications'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: /설정 완료하고 시작하기/ }))

    expect(await screen.findByText('MetroPick AI 대시보드')).toBeInTheDocument()

    const notifications = JSON.parse(
      window.localStorage.getItem('metropick-onboarding-notifications') ?? '{}',
    ) as { channelLabels?: string[]; enabledNotificationLabels?: string[] }

    expect(notifications.enabledNotificationLabels).toContain('개통 일정 변경 알림')
    expect(notifications.channelLabels).toEqual(['이메일', '웹 푸시'])
    expect(window.localStorage.getItem('metropick-onboarding-completed')).toBe('true')
    expect(window.localStorage.getItem('metropick-onboarding-summary')).toBeTruthy()
  })
})
