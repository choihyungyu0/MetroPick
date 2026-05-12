import { z } from 'zod'

import { businessTypeSchema } from '@/shared/types/station'

export const reportSchema = z.object({
  stationId: z.string().min(1),
  businessType: businessTypeSchema,
  summary: z.string().min(1),
  reasons: z.array(z.string().min(1)).min(1),
  risks: z.array(z.string().min(1)).min(1),
})

export type BusinessReport = z.infer<typeof reportSchema>

export const mockReports = reportSchema.array().parse([
  {
    stationId: 'cheomdan',
    businessType: 'cafe',
    summary:
      '첨단권역은 업무시설과 주거지가 함께 확장되는 생활권으로, 개통 시나리오에서는 점심·퇴근 시간대 카페 수요가 늘어날 가능성을 가정했습니다.',
    reasons: [
      '업무 밀집지와 주거 배후 수요가 함께 존재',
      '과밀도 지표가 주요 도심권보다 낮음',
    ],
    risks: [
      '개통 일정과 주변 개발 속도에 따라 체감 수요가 달라질 수 있음',
      '대형 프랜차이즈 진입 가능성',
    ],
  },
  {
    stationId: 'sangmu',
    businessType: 'convenienceStore',
    summary:
      '상무권역은 업무·상업 활동이 집중된 권역으로, 편의점은 야간과 주말의 즉시 소비 수요를 함께 검토할 수 있는 업종입니다.',
    reasons: [
      '업무 방문객과 지역 거주자의 구매 목적이 겹침',
      '소액 반복 구매 패턴을 기대할 수 있음',
    ],
    risks: [
      '기존 편의점 밀도가 높을 수 있음',
      '임대료와 운영시간 비용을 보수적으로 검토해야 함',
    ],
  },
  {
    stationId: 'chonnam-university',
    businessType: 'snackBar',
    summary:
      '전남대권역은 학생과 인근 주거 수요가 결합된 권역으로, 분식 업종은 가격 민감도가 높은 반복 소비층을 대상으로 검토할 수 있습니다.',
    reasons: [
      '등하교·식사 시간대 유동 인구 집중',
      '배달과 포장 수요를 함께 설계하기 쉬움',
    ],
    risks: ['방학과 시험 기간에 수요 편차가 큼', '저가 경쟁으로 객단가 관리가 필요함'],
  },
])
