import { z } from 'zod'

export const businessTypeSchema = z.enum([
  'cafe',
  'convenienceStore',
  'snackBar',
  'pharmacy',
  'hairSalon',
])

export type BusinessType = z.infer<typeof businessTypeSchema>

export const businessTypeLabels: Record<BusinessType, string> = {
  cafe: '카페',
  convenienceStore: '편의점',
  snackBar: '분식',
  pharmacy: '약국',
  hairSalon: '미용실',
}

export const stationPhaseSchema = z.enum(['phase1', 'phase2', 'planned'])

export type StationPhase = z.infer<typeof stationPhaseSchema>

export const stationPhaseLabels: Record<StationPhase, string> = {
  phase1: '1단계',
  phase2: '2단계',
  planned: '계획권역',
}

export const stationAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phase: stationPhaseSchema,
  floatingPopulationIndex: z.number().min(0).max(100),
  salesPotentialIndex: z.number().min(0).max(100),
  overcrowdingIndex: z.number().min(0).max(100),
  closureRiskIndex: z.number().min(0).max(100),
  startupSuitabilityScore: z.number().min(0).max(100),
  recommendedBusinessTypes: z.array(businessTypeSchema).min(1),
  keyReasons: z.array(z.string().min(1)).min(1),
  riskFactors: z.array(z.string().min(1)).min(1),
})

export type StationArea = z.infer<typeof stationAreaSchema>
