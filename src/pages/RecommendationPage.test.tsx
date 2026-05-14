import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecommendationPage } from './RecommendationPage'

function renderRecommendationPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecommendationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RecommendationPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('renders the location recommendation layout with the map image', () => {
    renderRecommendationPage()

    expect(
      screen.getByRole('heading', { name: '창업 유망 지점 추천' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('광주 2호선 창업 유망 지점 추천 지도')).toBeInTheDocument()
    expect(screen.getByText('AI 추천 Top 5')).toBeInTheDocument()
    expect(screen.getAllByText('상무역').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByText('입지 추천')
        .some((item) => item.getAttribute('aria-current') === 'page'),
    ).toBe(true)
  })

  it('saves an interest location to localStorage', async () => {
    const user = userEvent.setup()
    renderRecommendationPage()

    const saveButtons = screen.getAllByRole('button', { name: /관심 지역 저장/ })
    await user.click(saveButtons[0] as HTMLElement)

    const raw = window.localStorage.getItem('metropick-saved-interest-locations')
    expect(raw).not.toBeNull()

    const saved = JSON.parse(raw ?? '[]') as Array<{
      businessType: string
      score: number
      station: string
    }>
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      businessType: '카페/디저트',
      score: 92,
      station: '상무역',
    })
    expect(screen.getByText('관심 지역에 저장되었습니다.')).toBeInTheDocument()
  })
})
