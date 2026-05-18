import { useEffect, useMemo } from 'react'
import type { LatLngExpression } from 'leaflet'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'

import type { BackendCommercialAnalysisMapData } from '@/shared/api/backendCommercialAnalysisApi'

type CommercialAnalysisMapProps = {
  activeLayers: string[]
  data: BackendCommercialAnalysisMapData | null
}

const defaultCenter: LatLngExpression = [35.1595, 126.8526]
const defaultLayers = ['line_1', 'line_2', 'stations', 'density']

function getStationColor(score: number): string {
  if (score >= 70) {
    return '#15803d'
  }
  if (score >= 50) {
    return '#2563eb'
  }
  return '#f97316'
}

function MapViewport({ data }: { data: BackendCommercialAnalysisMapData | null }) {
  const map = useMap()

  useEffect(() => {
    if (!data) {
      map.setView(defaultCenter, 12)
      return
    }

    const selectedPoints = data.selected_station_circles.map(
      (circle) => [circle.lat, circle.lng] as [number, number],
    )
    const firstSelectedPoint = selectedPoints[0]
    if (selectedPoints.length === 1 && firstSelectedPoint) {
      map.setView(firstSelectedPoint, 15)
      return
    }
    if (selectedPoints.length > 1) {
      map.fitBounds(selectedPoints, { maxZoom: 15, padding: [28, 28] })
      return
    }

    map.setView([data.map.center.lat, data.map.center.lng], data.map.zoom)
  }, [data, map])

  return null
}

export function CommercialAnalysisMap({
  activeLayers,
  data,
}: CommercialAnalysisMapProps) {
  const layerSet = useMemo(
    () => new Set(activeLayers.length > 0 ? activeLayers : defaultLayers),
    [activeLayers],
  )
  const center: LatLngExpression = data
    ? [data.map.center.lat, data.map.center.lng]
    : defaultCenter
  const zoom = data?.map.zoom ?? 12

  return (
    <section
      aria-label="상권 분석 인터랙티브 지도"
      className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)]"
      role="region"
    >
      <MapContainer
        center={center}
        className="h-full min-h-[560px] w-full"
        scrollWheelZoom
        zoom={zoom}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport data={data} />

        {data?.route_lines.map((routeLine) => {
          const layerKey = routeLine.line === '1호선' ? 'line_1' : 'line_2'
          if (!layerSet.has(layerKey) || routeLine.points.length < 2) {
            return null
          }

          return (
            <Polyline
              color={routeLine.color}
              key={routeLine.line}
              opacity={0.82}
              pathOptions={{ dashArray: routeLine.line === '2호선' ? '8 8' : undefined }}
              positions={routeLine.points.map((point) => [point.lat, point.lng])}
              weight={5}
            />
          )
        })}

        {layerSet.has('density')
          ? data?.density_points.map((point) => (
              <CircleMarker
                center={[point.lat, point.lng]}
                color="#0f172a"
                fillColor="#f97316"
                fillOpacity={0.22}
                interactive={false}
                key={point.id}
                opacity={0.16}
                radius={4}
                weight={1}
              />
            ))
          : null}

        {layerSet.has('bus_stops')
          ? data?.bus_stop_markers.map((stop) => (
              <CircleMarker
                center={[stop.lat, stop.lng]}
                color="#475569"
                fillColor="#64748b"
                fillOpacity={0.52}
                key={stop.id}
                radius={3}
                weight={1}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  {stop.name}
                </Tooltip>
              </CircleMarker>
            ))
          : null}

        {data?.selected_station_circles.map((circle) => (
          <Circle
            center={[circle.lat, circle.lng]}
            color="#2563eb"
            fillColor="#2563eb"
            fillOpacity={0.08}
            key={circle.station_id}
            radius={circle.radius_m}
            weight={2}
          />
        ))}

        {layerSet.has('stations')
          ? data?.station_markers.map((station) => {
              const color = station.selected
                ? '#1d4ed8'
                : getStationColor(station.score.startup_suitability_score)

              return (
                <CircleMarker
                  center={[station.lat, station.lng]}
                  color={color}
                  fillColor={color}
                  fillOpacity={station.selected ? 0.9 : 0.72}
                  key={station.station_id}
                  radius={station.selected ? 10 : 7}
                  weight={2}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    {station.station_name} · {station.score.total_store_count.toLocaleString()}개
                  </Tooltip>
                  <Popup>
                    <div className="min-w-44 text-sm">
                      <p className="font-black text-slate-950">{station.station_name}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {station.line} · {station.district || station.dong || '광주광역시'}
                      </p>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-slate-500">점포</dt>
                          <dd className="font-bold">
                            {station.score.total_store_count.toLocaleString()}개
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">경쟁</dt>
                          <dd className="font-bold">
                            {station.score.competition_index.toFixed(1)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })
          : null}
      </MapContainer>
    </section>
  )
}
