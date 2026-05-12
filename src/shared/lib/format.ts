export function formatIndex(value: number) {
  return `${Math.round(value)}점`
}

export function formatPercentDelta(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${Math.round(value)}%`
}

export function formatMeters(value: number) {
  return value >= 1000 ? `${value / 1000}km` : `${value}m`
}
