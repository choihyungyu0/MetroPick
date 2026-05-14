import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { appRoutes } from './router'

const routeSmokeCases = [
  { path: '/', heading: /광주 2호선 개통 이후/ },
  { path: '/login', heading: /데이터로 먼저 보는/ },
  { path: '/signup', heading: '회원가입!' },
  { path: '/onboarding', heading: '초기 설정' },
  { path: '/onboarding/stations', heading: '관심 역세권 설정' },
  { path: '/onboarding/business-type', heading: '분석 업종 설정' },
  { path: '/onboarding/notifications', heading: '알림 설정' },
  { path: '/dashboard', heading: '광주 2호선 상권 변화 대시보드' },
  { path: '/commercial-analysis', heading: '역세권 상권 분석' },
  { path: '/ai-prediction', heading: 'AI 매출 변동 시뮬레이션' },
  { path: '/recommendation', heading: '창업 유망 지점 추천' },
  { path: '/report', heading: '미래 매출 예측 리포트' },
  { path: '/mypage', heading: '마이페이지' },
] as const

describe('app router', () => {
  it.each(routeSmokeCases)('renders $path', async ({ heading, path }) => {
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] })

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
