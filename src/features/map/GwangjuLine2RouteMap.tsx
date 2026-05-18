import { useEffect, useMemo } from 'react'
import { divIcon } from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'

import type { BackendRecommendationItem } from '@/shared/api/backendRecommendationApi'
import { gwangjuLine2RouteStations } from '@/shared/data/gwangjuLine2Route'

type GwangjuLine2RouteMapProps = {
  isRecommendationLoading: boolean
  recommendationItems: BackendRecommendationItem[]
}

type RoutePoint = [number, number]

type RecommendationMarker = BackendRecommendationItem & {
  lat: number
  lng: number
}

const gwangjuCenter: LatLngExpression = [35.1595, 126.872]
const routeStations = gwangjuLine2RouteStations.filter(
  (station) => !station.id.endsWith('-close'),
)

function isValidCoordinate(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isRecommendationMarker(
  item: BackendRecommendationItem,
): item is RecommendationMarker {
  return isValidCoordinate(item.lat) && isValidCoordinate(item.lng)
}

function createStationIcon() {
  return divIcon({
    className: 'line2-station-marker',
    html: '<span style="background:#fff;border:4px solid #00a889;border-radius:9999px;box-shadow:0 5px 12px rgba(15,118,110,.25);display:block;height:18px;width:18px;"></span>',
    iconAnchor: [9, 9],
    iconSize: [18, 18],
  })
}

function createRecommendationIcon(rank: number) {
  return divIcon({
    className: 'line2-recommendation-marker',
    html: `<span style="align-items:center;background:#2563eb;border:3px solid #fff;border-radius:9999px;box-shadow:0 8px 18px rgba(37,99,235,.32);color:#fff;display:flex;font-size:12px;font-weight:900;height:28px;justify-content:center;width:28px;">${rank}</span>`,
    iconAnchor: [14, 14],
    iconSize: [28, 28],
  })
}

function formatRecommendationLabel(item: BackendRecommendationItem): string {
  return item.display_station_name?.trim() || item.station_name
}

function Line2MapViewport({ positions }: { positions: RoutePoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { maxZoom: 13, padding: [32, 32] })
      return
    }

    map.setView(gwangjuCenter, 12)
  }, [map, positions])

  return null
}

export function GwangjuLine2RouteMap({
  isRecommendationLoading,
  recommendationItems,
}: GwangjuLine2RouteMapProps) {
  const routePositions = useMemo(
    () =>
      gwangjuLine2RouteStations.map(
        (station): RoutePoint => [station.lat, station.lng],
      ),
    [],
  )
  const recommendationMarkers = useMemo(
    () => recommendationItems.filter(isRecommendationMarker).slice(0, 5),
    [recommendationItems],
  )
  const viewportPositions = useMemo(
    () => [
      ...routePositions,
      ...recommendationMarkers.map((item): RoutePoint => [item.lat, item.lng]),
    ],
    [recommendationMarkers, routePositions],
  )
  const recommendationStatus = isRecommendationLoading
    ? '추천 좌표 불러오는 중'
    : recommendationMarkers.length > 0
      ? `추천 Top ${recommendationMarkers.length} 표시`
      : '추천 CSV 좌표 없음'

  return (
    <section
      aria-label="광주 2호선 실제 지도"
      className="relative h-full w-full overflow-hidden"
      data-testid="dashboard-line2-route-map"
      role="region"
    >
      <MapContainer
        center={gwangjuCenter}
        className="h-full w-full"
        scrollWheelZoom
        zoom={12}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Line2MapViewport positions={viewportPositions} />

        <Polyline
          color="#00a889"
          opacity={0.92}
          pathOptions={{ lineCap: 'round', lineJoin: 'round' }}
          positions={routePositions}
          weight={6}
        />

        {routeStations.map((station) => (
          <Marker
            icon={createStationIcon()}
            key={station.id}
            position={[station.lat, station.lng]}
          >
            <Tooltip
              direction="top"
              offset={[0, -11]}
              permanent={station.showLabel}
              opacity={1}
            >
              {station.name}
            </Tooltip>
          </Marker>
        ))}

        {recommendationMarkers.map((item) => (
          <Marker
            icon={createRecommendationIcon(item.rank)}
            key={`${item.rank}-${item.station_id}`}
            position={[item.lat, item.lng]}
          >
            <Tooltip direction="top" offset={[0, -18]} permanent>
              추천 {item.rank} · {formatRecommendationLabel(item)}
            </Tooltip>
            <Popup>
              <div className="min-w-44 text-sm">
                <p className="font-black text-slate-950">
                  {item.rank}위 {formatRecommendationLabel(item)}
                </p>
                <dl className="mt-2 grid gap-1 text-xs text-slate-700">
                  <div className="flex justify-between gap-3">
                    <dt>추천 업종</dt>
                    <dd className="font-bold">
                      {item.recommended_business_type || '업종 미정'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>적합도</dt>
                    <dd className="font-bold">
                      {item.startup_suitability_score.toFixed(1)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>위험 수준</dt>
                    <dd className="font-bold">{item.risk_level || '정보 없음'}</dd>
                  </div>
                </dl>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-wrap items-end justify-between gap-2 text-[11px] font-black">
        <div className="flex flex-wrap gap-2 rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-slate-700 shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-[#00a889]" />
            2호선 예정 경로
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-[9px] text-white">
              1
            </span>
            {recommendationStatus}
          </span>
        </div>
        <div className="rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-slate-600 shadow-sm">
          지도 기준: OpenStreetMap + 2호선 예정 경로 좌표
        </div>
      </div>
    </section>
  )
}
