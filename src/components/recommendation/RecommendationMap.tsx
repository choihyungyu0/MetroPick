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

import type {
  BackendRecommendationItem,
  BackendRecommendationMap,
} from '@/shared/api/backendRecommendationApi'

type RecommendationMapProps = {
  items: BackendRecommendationItem[]
  map?: BackendRecommendationMap
}

type RecommendationMarkerItem = BackendRecommendationItem & {
  lat: number
  lng: number
}

const gwangjuCenter: [number, number] = [35.1595, 126.8526]

function isValidCoordinate(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isRecommendationMarkerItem(
  item: BackendRecommendationItem,
): item is RecommendationMarkerItem {
  return isValidCoordinate(item.lat) && isValidCoordinate(item.lng)
}

function isRoutePoint(point: [number, number]): boolean {
  return point.every((value) => Number.isFinite(value))
}

function createRankIcon(rank: number) {
  return divIcon({
    className: 'recommendation-rank-marker',
    html: `<span style="align-items:center;background:#2563eb;border:2px solid #fff;border-radius:9999px;box-shadow:0 8px 18px rgba(37,99,235,.28);color:#fff;display:flex;font-size:13px;font-weight:900;height:30px;justify-content:center;width:30px;">${rank}</span>`,
    iconAnchor: [15, 15],
    iconSize: [30, 30],
  })
}

function RecommendationMapViewport({
  center,
  markerPositions,
  zoom,
}: {
  center: LatLngExpression
  markerPositions: Array<[number, number]>
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    if (markerPositions.length > 0) {
      map.fitBounds(markerPositions, { maxZoom: 15, padding: [32, 32] })
      return
    }

    map.setView(center, zoom)
  }, [center, markerPositions, map, zoom])

  return null
}

export function RecommendationMap({ items, map }: RecommendationMapProps) {
  const markers = useMemo(
    () => items.filter(isRecommendationMarkerItem).slice(0, 5),
    [items],
  )
  const markerPositions = useMemo(
    () => markers.map((item) => [item.lat, item.lng] as [number, number]),
    [markers],
  )
  const routePositions = useMemo(
    () => (map?.route ?? []).filter(isRoutePoint),
    [map?.route],
  )
  const center: LatLngExpression = map?.center ?? gwangjuCenter
  const zoom = map?.zoom ?? 12

  return (
    <section
      aria-label="추천 지역 인터랙티브 지도"
      className="relative h-full w-full"
      role="region"
    >
      <MapContainer center={center} className="h-full w-full" scrollWheelZoom zoom={zoom}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecommendationMapViewport
          center={center}
          markerPositions={markerPositions}
          zoom={zoom}
        />

        {routePositions.length >= 2 ? (
          <Polyline color="#ef4444" opacity={0.82} positions={routePositions} weight={4} />
        ) : null}

        {markers.map((item) => (
          <Marker
            icon={createRankIcon(item.rank)}
            key={`${item.rank}-${item.station_id}`}
            position={[item.lat, item.lng]}
          >
            <Tooltip direction="top" offset={[0, -14]} permanent>
              추천 {item.rank} · {item.display_station_name}
            </Tooltip>
            <Popup>
              <div className="min-w-44 text-sm">
                <p className="font-black text-slate-950">
                  {item.rank}위 {item.display_station_name}
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

      {markers.length === 0 ? (
        <div
          className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-lg border border-amber-200 bg-white/95 px-3 py-2 text-center text-xs font-black text-amber-700 shadow-sm"
          role="status"
        >
          추천 지역 좌표를 불러오지 못했습니다.
        </div>
      ) : null}
    </section>
  )
}
