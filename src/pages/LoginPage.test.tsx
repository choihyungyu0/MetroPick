import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LoginPage } from './LoginPage'

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the login page copy and preview image', () => {
    renderLoginPage()

    expect(screen.getAllByText('로그인').length).toBeGreaterThan(0)
    expect(screen.getByText(/데이터로 먼저 보는/)).toBeInTheDocument()
    expect(screen.getByText('광주 상권의 미래')).toBeInTheDocument()
    expect(
      screen.getByAltText('광주 2호선 예상 상권 변화 지도 미리보기'),
    ).toBeInTheDocument()
  })
})
