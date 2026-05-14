import { Badge } from '@/shared/components/Badge'

type BackendStatus = 'connected' | 'fallback' | 'loading'

type BackendStatusBadgeProps = {
  status: BackendStatus
  connectedLabel: string
  fallbackLabel: string
  loadingLabel: string
}

export function BackendStatusBadge({
  status,
  connectedLabel,
  fallbackLabel,
  loadingLabel,
}: BackendStatusBadgeProps) {
  const label =
    status === 'connected'
      ? connectedLabel
      : status === 'loading'
        ? loadingLabel
        : fallbackLabel
  const tone = status === 'connected' ? 'success' : status === 'loading' ? 'info' : 'neutral'

  return (
    <Badge className="shrink-0 font-black" tone={tone}>
      {label}
    </Badge>
  )
}
