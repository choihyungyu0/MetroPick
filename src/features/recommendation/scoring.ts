export type RecommendationScoreInput = {
  salesPotentialIndex: number
  floatingPopulationIndex: number
  businessDemandFit: number
  overcrowdingIndex: number
  closureRiskIndex: number
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function calculateStartupSuitabilityScore(input: RecommendationScoreInput) {
  return clampScore(
    0.35 * input.salesPotentialIndex +
      0.25 * input.floatingPopulationIndex +
      0.15 * input.businessDemandFit -
      0.15 * input.overcrowdingIndex -
      0.1 * input.closureRiskIndex,
  )
}
