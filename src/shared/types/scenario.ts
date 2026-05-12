import { z } from 'zod'

export const openingScenarioSchema = z.enum([
  'phase1Opening',
  'phase2Expansion',
  'delayedOpening',
])

export type OpeningScenario = z.infer<typeof openingScenarioSchema>

export type ScenarioOption = {
  id: OpeningScenario
  label: string
  description: string
}

export const scenarioOptions: readonly ScenarioOption[] = [
  {
    id: 'phase1Opening',
    label: '1단계 개통 시나리오',
    description: '초기 개통 구간 주변 생활권의 접근성 변화를 가정합니다.',
  },
  {
    id: 'phase2Expansion',
    label: '2단계 확장 시나리오',
    description: '확장 구간까지 연결된 뒤의 권역 간 이동 흐름을 가정합니다.',
  },
  {
    id: 'delayedOpening',
    label: '지연 개통 시나리오',
    description: '상권 변화가 늦게 반영되는 보수적 상황을 가정합니다.',
  },
]

export const radiusSchema = z.enum(['300', '500', '1000'])

export type RadiusOption = z.infer<typeof radiusSchema>

export const radiusLabels: Record<RadiusOption, string> = {
  '300': '300m',
  '500': '500m',
  '1000': '1km',
}
