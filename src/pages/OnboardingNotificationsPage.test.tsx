import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OnboardingNotificationsPage } from './OnboardingNotificationsPage'

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

function renderNotificationsPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <OnboardingNotificationsPage />
    </MemoryRouter>,
  )
}

describe('OnboardingNotificationsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
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

    renderWithQueryClient(<RouterProvider router={router} />)

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

    renderWithQueryClient(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: /설정 완료하고 시작하기/ }))

    expect(
      await screen.findByText('백엔드 미연결 · 로컬에 초기 설정을 저장했어요.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('MetroPick AI 대시보드')).toBeInTheDocument()

    const notifications = JSON.parse(
      window.localStorage.getItem('metropick-onboarding-notifications') ?? '{}',
    ) as { channelLabels?: string[]; enabledNotificationLabels?: string[] }

    expect(notifications.enabledNotificationLabels).toContain('개통 일정 변경 알림')
    expect(notifications.channelLabels).toEqual(['이메일', '웹 푸시'])
    expect(window.localStorage.getItem('metropick-onboarding-completed')).toBe('true')
    expect(window.localStorage.getItem('metropick-onboarding-summary')).toBeTruthy()
  })

  it('saves final onboarding state to the backend when available', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      'metropick-onboarding-stations',
      JSON.stringify({
        selectedStations: ['상무역', '운천역'],
        radius: '500m',
      }),
    )
    window.localStorage.setItem(
      'metropick-onboarding-business-types',
      JSON.stringify({
        selectedBusinessTypes: ['cafe-dessert'],
        selectedBusinessLabels: ['카페/디저트'],
      }),
    )
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/onboarding-settings') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            data_status: 'supabase_connected',
            setting: {
              id: 'backend-onboarding-setting',
              region: '광주광역시 전체',
              selected_stations: ['상무역', '운천역'],
              selected_business_types: ['카페/디저트'],
              radius: '500m',
              notification_settings: {},
              created_at: '2026-05-15T00:00:00+00:00',
            },
          }),
        } satisfies Pick<Response, 'json' | 'ok'>
      }

      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchMock)
    const router = createMemoryRouter(
      [
        { path: '/onboarding/notifications', element: <OnboardingNotificationsPage /> },
        { path: '/dashboard', element: <h1>MetroPick AI 대시보드</h1> },
      ],
      { initialEntries: ['/onboarding/notifications'] },
    )

    renderWithQueryClient(<RouterProvider router={router} />)

    await user.click(screen.getByRole('button', { name: /설정 완료하고 시작하기/ }))

    expect(
      await screen.findByText('Supabase에 초기 설정을 저장했어요.'),
    ).toBeInTheDocument()

    const saveCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/onboarding-settings'),
    )
    expect(saveCall).toBeDefined()

    const body = JSON.parse(String(saveCall?.[1]?.body ?? '{}')) as {
      notification_settings?: {
        channels?: string[]
        enabled_notifications?: string[]
        frequency?: string
      }
      radius?: string
      selected_business_types?: string[]
      selected_stations?: string[]
    }
    expect(body).toMatchObject({
      selected_stations: ['상무역', '운천역'],
      selected_business_types: ['카페/디저트'],
      radius: '500m',
    })
    expect(body.notification_settings).toMatchObject({
      channels: ['email', 'web-push'],
      frequency: 'realtime',
    })
    expect(body.notification_settings?.enabled_notifications).toContain(
      '개통 일정 변경 알림',
    )
    expect(await screen.findByText('MetroPick AI 대시보드')).toBeInTheDocument()
  })
})
