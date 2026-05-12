import { CircleMarker, Popup, Tooltip } from 'react-leaflet'

import { Badge } from '@/shared/components/Badge'
import { formatIndex } from '@/shared/lib/format'
import { stationPhaseLabels, type StationArea } from '@/shared/types/station'

type StationLayerProps = {
  stations: StationArea[]
}

function getScoreColor(score: number) {
  if (score >= 48) {
    return '#1f5c51'
  }

  if (score >= 44) {
    return '#326fd1'
  }

  return '#a15c06'
}

export function StationLayer({ stations }: StationLayerProps) {
  return (
    <>
      {stations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.latitude, station.longitude]}
          color={getScoreColor(station.startupSuitabilityScore)}
          fillColor={getScoreColor(station.startupSuitabilityScore)}
          fillOpacity={0.72}
          radius={12}
          weight={2}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            {station.name} · {formatIndex(station.startupSuitabilityScore)}
          </Tooltip>
          <Popup>
            <div className="min-w-44 space-y-2">
              <div>
                <p className="font-semibold text-slate-950">{station.name}</p>
                <p className="text-xs text-slate-600">{station.district}</p>
              </div>
              <Badge tone="info">{stationPhaseLabels[station.phase]}</Badge>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">유동</dt>
                  <dd className="font-semibold">
                    {formatIndex(station.floatingPopulationIndex)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">잠재력</dt>
                  <dd className="font-semibold">
                    {formatIndex(station.salesPotentialIndex)}
                  </dd>
                </div>
              </dl>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}
