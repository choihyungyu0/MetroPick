import { beforeEach, describe, expect, it } from 'vitest'

import { safeParseStorage } from './storage'

describe('safeParseStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when stored JSON is malformed', () => {
    window.localStorage.setItem('metropick-malformed', '{not-json')

    expect(safeParseStorage('metropick-malformed')).toBeNull()
  })
})
