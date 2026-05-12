import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommercialAnalysisPage } from './CommercialAnalysisPage'

function renderCommercialAnalysisPage() {
  return render(
    <MemoryRouter>
      <CommercialAnalysisPage />
    </MemoryRouter>,
  )
}

describe('CommercialAnalysisPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the commercial analysis layout with the map image', () => {
    renderCommercialAnalysisPage()

    expect(screen.getByRole('heading', { name: '역세권 상권 분석' })).toBeInTheDocument()
    expect(screen.getByAltText('광주 2호선 역세권 상권 밀집도 지도')).toBeInTheDocument()
    expect(screen.getByText(/선택 영역 요약/)).toBeInTheDocument()
    expect(screen.getAllByText('상무역').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByText('상권 분석')
        .some((item) => item.getAttribute('aria-current') === 'page'),
    ).toBe(true)
  })

  it('saves a commercial analysis report to localStorage', async () => {
    const user = userEvent.setup()
    renderCommercialAnalysisPage()

    await user.click(screen.getByRole('button', { name: '리포트로 저장' }))

    const raw = window.localStorage.getItem('metropick-saved-commercial-analysis-reports')
    expect(raw).not.toBeNull()

    const reports = JSON.parse(raw ?? '[]') as Array<{ title: string; radius: string }>
    expect(reports).toHaveLength(1)
    expect(reports[0]).toMatchObject({
      title: '역세권 상권 분석 리포트',
      radius: '500m',
    })
    expect(screen.getByText('리포트가 저장되었습니다.')).toBeInTheDocument()
  })
})
