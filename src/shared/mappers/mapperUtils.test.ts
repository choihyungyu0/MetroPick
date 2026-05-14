import { describe, expect, it } from 'vitest'

import {
  isValidCoordinate,
  normalizeKoreanText,
  parseDateLike,
  toNumber,
  toStringValue,
} from './mapperUtils'

describe('mapperUtils', () => {
  it('parses numeric strings safely', () => {
    expect(toNumber('1,240')).toBe(1240)
    expect(toNumber('8.7%')).toBe(8.7)
    expect(toNumber('not-a-number', 5)).toBe(5)
  })

  it('normalizes missing and spaced text', () => {
    expect(toStringValue(undefined)).toBe('')
    expect(normalizeKoreanText('  상무   역  ')).toBe('상무 역')
  })

  it('parses common date shapes and rejects malformed dates', () => {
    expect(parseDateLike('20240601')).toBe('2024-06-01')
    expect(parseDateLike('2024.06.01')).toBe('2024-06-01')
    expect(parseDateLike('2024-13-01')).toBeNull()
  })

  it('checks coordinate bounds', () => {
    expect(isValidCoordinate(126.8497)).toBe(true)
    expect(isValidCoordinate(999)).toBe(false)
  })
})
