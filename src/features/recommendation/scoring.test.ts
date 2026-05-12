import { describe, expect, it } from 'vitest'

import { calculateStartupSuitabilityScore } from './scoring'

describe('calculateStartupSuitabilityScore', () => {
  it('calculates the weighted recommendation score', () => {
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

  it('clamps the score to the upper bound', () => {
    expect(
      calculateStartupSuitabilityScore({
        salesPotentialIndex: 300,
        floatingPopulationIndex: 300,
        businessDemandFit: 300,
        overcrowdingIndex: 0,
        closureRiskIndex: 0,
      }),
    ).toBe(100)
  })

  it('clamps the score to the lower bound', () => {
    expect(
      calculateStartupSuitabilityScore({
        salesPotentialIndex: 0,
        floatingPopulationIndex: 0,
        businessDemandFit: 0,
        overcrowdingIndex: 500,
        closureRiskIndex: 500,
      }),
    ).toBe(0)
  })
})
