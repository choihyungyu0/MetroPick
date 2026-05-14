export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim().replace(/[,%\s]/g, '')
  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }

  return fallback
}

export function normalizeKoreanText(value: unknown): string {
  return toStringValue(value).replace(/\s+/g, ' ')
}

function toDateString(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day))
  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  if (!isValid) {
    return null
  }

  const paddedMonth = String(month).padStart(2, '0')
  const paddedDay = String(day).padStart(2, '0')

  return `${year}-${paddedMonth}-${paddedDay}`
}

export function parseDateLike(value: unknown): string | null {
  const raw = toStringValue(value)

  if (!raw) {
    return null
  }

  const compact = raw.replace(/\s+/g, '')
  const yyyymmdd = compact.match(/^(\d{4})(\d{2})(\d{2})$/)
  const delimited = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  const korean = compact.match(/^(\d{4})년(\d{1,2})월(\d{1,2})일?$/)
  const match = yyyymmdd ?? delimited ?? korean

  if (!match) {
    return null
  }

  const [, year, month, day] = match

  if (!year || !month || !day) {
    return null
  }

  return toDateString(Number(year), Number(month), Number(day))
}

export function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}
