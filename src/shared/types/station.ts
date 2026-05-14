import { z } from 'zod'

export type MetroPhase = '1단계' | '2단계' | '예정' | '기존'

export type LegacyBusinessType =
  | 'cafe'
  | 'convenienceStore'
  | 'snackBar'
  | 'pharmacy'
  | 'hairSalon'

export type BusinessType = LegacyBusinessType

export type StationArea = {
  id: string
  name: string
  district: string
  latitude: number
  longitude: number
  line: string
  phase: MetroPhase
  openingScenario: string
  floatingPopulationIndex: number
  salesPotentialIndex: number
  overcrowdingIndex: number
  closureRiskIndex: number
  startupSuitabilityScore: number
  recommendedBusinessTypes: LegacyBusinessType[]
  keyReasons: string[]
  riskFactors: string[]
}

export const businessTypeSchema = z.enum([
  'cafe',
  'convenienceStore',
  'snackBar',
  'pharmacy',
  'hairSalon',
])

export const businessTypeLabels: Record<BusinessType, string> = {
  cafe: '카페',
  convenienceStore: '편의점',
  snackBar: '분식',
  pharmacy: '약국',
  hairSalon: '미용실',
}

export const metroPhaseSchema = z.enum(['1단계', '2단계', '예정', '기존'])
export const stationPhaseSchema = metroPhaseSchema

export type StationPhase = MetroPhase

export const stationPhaseLabels: Record<StationPhase, string> = {
  '1단계': '1단계',
  '2단계': '2단계',
  기존: '기존',
  예정: '예정',
}

export const stationAreaSchema: z.ZodType<StationArea> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  line: z.string().min(1),
  phase: metroPhaseSchema,
  openingScenario: z.string().min(1),
  floatingPopulationIndex: z.number().min(0).max(100),
  salesPotentialIndex: z.number().min(0).max(100),
  overcrowdingIndex: z.number().min(0).max(100),
  closureRiskIndex: z.number().min(0).max(100),
  startupSuitabilityScore: z.number().min(0).max(100),
  recommendedBusinessTypes: z.array(businessTypeSchema).min(1),
  keyReasons: z.array(z.string().min(1)).min(1),
  riskFactors: z.array(z.string().min(1)).min(1),
})
