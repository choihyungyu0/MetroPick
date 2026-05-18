import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ReportPage } from './ReportPage'

function renderReportPage() {
  return render(
    <MemoryRouter>
      <ReportPage />
    </MemoryRouter>,
  )
}

describe('ReportPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the future sales report with local image assets', () => {
    renderReportPage()

    expect(
      screen.getByRole('heading', { name: '미래 매출 예측 리포트' }),
    ).toBeInTheDocument()
    expect(
      screen.getByAltText('백운광장역 개통 예정 상권 대표 이미지'),
    ).toBeInTheDocument()
    expect(screen.getByAltText('연도별 예상 매출 추이 차트')).toBeInTheDocument()
    expect(screen.getByAltText('백운광장역 500m 상권 지도 스냅샷')).toBeInTheDocument()
    expect(screen.getAllByText('백운광장역 500m 상권').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByText('리포트')
        .some((item) => item.getAttribute('aria-current') === 'page'),
    ).toBe(true)

    const raw = window.localStorage.getItem('metropick-current-report')
    expect(raw).not.toBeNull()
    const report = JSON.parse(raw ?? '{}') as {
      businessType?: string
      stationArea?: string
      title?: string
    }
    expect(report).toMatchObject({
      businessType: '카페/커피전문점',
      stationArea: '백운광장역 500m 상권',
      title: '백운광장역 500m 상권 미래 매출 예측 리포트',
    })
  })

  it('renders the selected recommendation report context', () => {
    window.localStorage.setItem(
      'metropick-selected-recommendation',
      JSON.stringify({
        businessType: '카페/디저트',
        score: 100,
        station: '상무2동 예정역',
      }),
    )

    renderReportPage()

    expect(screen.getAllByText('상무2동 예정역 500m 상권').length).toBeGreaterThan(0)
    expect(screen.getAllByText('카페/디저트').length).toBeGreaterThan(0)
    expect(
      screen.getByAltText('상무2동 예정역 개통 예정 상권 대표 이미지'),
    ).toBeInTheDocument()
    expect(
      screen.getByAltText('상무2동 예정역 500m 상권 지도 스냅샷'),
    ).toBeInTheDocument()

    const raw = window.localStorage.getItem('metropick-current-report')
    const report = JSON.parse(raw ?? '{}') as {
      businessType?: string
      stationArea?: string
      title?: string
    }
    expect(report).toMatchObject({
      businessType: '카페/디저트',
      stationArea: '상무2동 예정역 500m 상권',
      title: '상무2동 예정역 500m 상권 미래 매출 예측 리포트',
    })
  })

  it('shows feedback for share and PDF actions', async () => {
    const user = userEvent.setup()
    renderReportPage()

    await user.click(screen.getByRole('button', { name: /공유하기/ }))
    expect(screen.getByText('리포트 링크가 복사되었습니다.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /PDF 저장/ }))
    expect(screen.getByText('PDF 저장 기능은 추후 연동 예정입니다.')).toBeInTheDocument()
  })
})
