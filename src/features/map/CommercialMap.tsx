import type { LatLngExpression } from 'leaflet'
import { MapContainer } from 'react-leaflet'

import { Card } from '@/shared/components/Card'
import type { StationArea } from '@/shared/types/station'

import { MapLegend } from './MapLegend'
import { StationLayer } from './StationLayer'

type CommercialMapProps = {
  stations: StationArea[]
}

const gwangjuCenter: LatLngExpression = [35.1595, 126.8526]

export function CommercialMap({ stations }: CommercialMapProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950">광주 2호선 권역 지도</h2>
          <p className="mt-1 text-sm text-slate-600">
            실제 예측 지도가 아닌 역세권 시나리오 검토용 위치 표시입니다.
          </p>
        </div>
        <p className="text-xs font-semibold text-slate-500">8개 mock 권역</p>
      </div>
      <div
        className="relative h-[360px] sm:h-[420px]"
        role="img"
        aria-label="광주 도시철도 2호선 계획 권역의 모의 상권 지도"
      >
        <MapContainer
          center={gwangjuCenter}
          className="h-full w-full"
          dragging
          doubleClickZoom={false}
          scrollWheelZoom={false}
          zoom={12}
          zoomControl={false}
        >
          <StationLayer stations={stations} />
        </MapContainer>
        <MapLegend />
      </div>
    </Card>
  )
}
