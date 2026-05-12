import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DashboardPage } from './DashboardPage'

vi.mock('@/features/map/CommercialMap', () => ({
  CommercialMap: () => <div aria-label="지도 mock" />,
}))

function renderDashboardPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  it('renders the Korean service title', async () => {
    renderDashboardPage()

    expect(
      await screen.findByRole('heading', {
        name: '광주 2호선 AI 상권 시뮬레이터',
      }),
    ).toBeInTheDocument()
  })
})
