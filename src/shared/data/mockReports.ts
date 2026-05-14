import { z } from 'zod'

import type { SavedReport } from '@/shared/types/report'
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
      '첨단지구역은 업무시설과 주거지가 함께 확장되는 생활권으로, 개통 시나리오에서는 점심·퇴근 시간대 카페 수요가 늘어날 가능성을 검토할 수 있습니다.',
    reasons: [
      '업무 배후와 주거 배후 수요가 함께 존재',
      '과밀한 도심 상권보다 신규 수요를 관찰하기 쉬움',
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
      '상무역은 업무·상업 활동이 집중된 권역으로, 편의점은 야간과 주말의 즉시 소비 수요를 함께 검토할 수 있는 업종입니다.',
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
      '전남대역은 학생과 인근 주거 수요가 결합된 권역으로, 분식 업종은 가격 민감도가 높은 반복 소비층을 대상으로 검토할 수 있습니다.',
    reasons: [
      '등하교·식사 시간대 유동 인구 집중',
      '간편식과 포장 수요를 함께 설계하기 쉬움',
    ],
    risks: ['방학과 시험 기간에 수요 편차가 큼', '저가 경쟁으로 객단가 관리가 필요함'],
  },
])

export const mockSavedReports: SavedReport[] = [
  {
    id: 'saved-commercial-sangmu',
    title: '상무역 상권 분석 리포트',
    category: '상권 분석',
    stationArea: '상무역',
    businessType: '카페/디저트',
    savedAt: '2024.06.18 14:30',
    thumbnailSrc: '/assets/report/report-area-map.png',
  },
  {
    id: 'saved-ai-baegun',
    title: '백운광장역 매출 예측 리포트',
    category: 'AI 예측',
    stationArea: '백운광장역',
    businessType: '카페/커피전문점',
    savedAt: '2024.06.15 16:45',
    thumbnailSrc: '/assets/report/report-sales-trend-chart.png',
  },
  {
    id: 'saved-recommendation-uncheon',
    title: '운천역 입지 추천 리포트',
    category: '입지 추천',
    stationArea: '운천역',
    businessType: '음식점',
    savedAt: '2024.06.16 09:15',
    thumbnailSrc: '/assets/recommendation/recommended-locations-map.png',
  },
]
