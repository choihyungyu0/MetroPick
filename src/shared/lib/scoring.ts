export type StartupSuitabilityScoreInput = {
  salesPotentialIndex: number
  floatingPopulationIndex: number
  businessDemandFit: number
  overcrowdingIndex: number
  closureRiskIndex: number
}

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function calculateStartupSuitabilityScore(
  input: StartupSuitabilityScoreInput,
): number {
  return clampScore(
    0.35 * input.salesPotentialIndex +
      0.25 * input.floatingPopulationIndex +
      0.15 * input.businessDemandFit -
      0.15 * input.overcrowdingIndex -
      0.1 * input.closureRiskIndex,
  )
}

export function calculateRiskLevel(score: number): '낮음' | '보통' | '높음' {
  if (score >= 75) {
    return '낮음'
  }

  if (score >= 50) {
    return '보통'
  }

  return '높음'
}
