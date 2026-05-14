import { describe, expect, it } from 'vitest'

import {
  calculateRiskLevel,
  calculateStartupSuitabilityScore,
  clampScore,
} from './scoring'

describe('scoring utilities', () => {
  it('clamps scores to the configured bounds', () => {
    expect(clampScore(120)).toBe(100)
    expect(clampScore(-8)).toBe(0)
    expect(clampScore(8, 10, 90)).toBe(10)
  })

  it('calculates the weighted startup suitability score deterministically', () => {
    expect(
      calculateStartupSuitabilityScore({
        salesPotentialIndex: 80,
        floatingPopulationIndex: 60,
        businessDemandFit: 70,
        overcrowdingIndex: 40,
        closureRiskIndex: 20,
      }),
    ).toBe(46)
  })

  it('maps suitability scores to risk levels', () => {
    expect(calculateRiskLevel(80)).toBe('낮음')
    expect(calculateRiskLevel(64)).toBe('보통')
    expect(calculateRiskLevel(49)).toBe('높음')
  })
})
