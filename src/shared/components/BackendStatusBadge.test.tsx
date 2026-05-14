import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'

describe('BackendStatusBadge', () => {
  it('renders the connected label', () => {
    render(
      <BackendStatusBadge
        connectedLabel="FastAPI 샘플 데이터 연결됨"
        fallbackLabel="백엔드 미연결 · 목업 데이터 표시"
        loadingLabel="FastAPI 연결 확인 중"
        status="connected"
      />,
    )

    expect(screen.getByText('FastAPI 샘플 데이터 연결됨')).toBeInTheDocument()
  })

  it('renders the fallback label', () => {
    render(
      <BackendStatusBadge
        connectedLabel="FastAPI 샘플 데이터 연결됨"
        fallbackLabel="백엔드 미연결 · 목업 데이터 표시"
        loadingLabel="FastAPI 연결 확인 중"
        status="fallback"
      />,
    )

    expect(screen.getByText('백엔드 미연결 · 목업 데이터 표시')).toBeInTheDocument()
  })
})
