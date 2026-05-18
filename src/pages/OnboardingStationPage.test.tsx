import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { OnboardingStationPage } from './OnboardingStationPage'

vi.mock('react-leaflet', async () => {
  const React = await import('react')

  const Layer = ({ children }: { children?: ReactNode }) =>
    React.createElement('div', null, children)

  return {
    Circle: Layer,
    CircleMarker: Layer,
    MapContainer: ({ children }: { children?: ReactNode }) =>
      React.createElement('div', { 'data-testid': 'onboarding-leaflet-map' }, children),
    Polyline: Layer,
    Popup: Layer,
    TileLayer: () => React.createElement('div', { 'data-testid': 'osm-tile-layer' }),
    Tooltip: Layer,
    useMap: () => ({
      fitBounds: () => undefined,
      setView: () => undefined,
    }),
  }
})

function renderOnboardingStationPage() {
  return render(
    <MemoryRouter>
      <OnboardingStationPage />
    </MemoryRouter>,
  )
}

describe('OnboardingStationPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the station onboarding screen with default selected count', () => {
    renderOnboardingStationPage()

    expect(
      screen.getByRole('heading', { level: 1, name: '관심 역세권 설정' }),
    ).toBeInTheDocument()
    expect(screen.getByText('4 / 5 선택')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '선택 역세권 인터랙티브 지도' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('onboarding-leaflet-map')).toBeInTheDocument()
    expect(screen.getByTestId('osm-tile-layer')).toBeInTheDocument()
    expect(
      screen.queryByAltText('선택한 광주 2호선 역세권 미리보기 지도'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('4개 역세권 / 반경 500m')).toBeInTheDocument()
  })

  it('updates selected station count when a station is selected', async () => {
    const user = userEvent.setup()
    renderOnboardingStationPage()

    await user.click(screen.getByRole('button', { name: /운천역/ }))

    expect(screen.getByText('5 / 5 선택')).toBeInTheDocument()
  })

  it('updates the summary when radius changes', async () => {
    const user = userEvent.setup()
    renderOnboardingStationPage()

    await user.click(screen.getByRole('button', { name: '1km' }))

    expect(screen.getByText('4개 역세권 / 반경 1km')).toBeInTheDocument()
  })
})
