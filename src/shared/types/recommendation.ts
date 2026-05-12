import { z } from 'zod'

import { businessTypeSchema } from './station'

export const recommendationSchema = z.object({
  stationId: z.string().min(1),
  businessType: businessTypeSchema,
  businessDemandFit: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  recommendationReasons: z.array(z.string().min(1)).min(1),
})

export type StationRecommendation = z.infer<typeof recommendationSchema>
