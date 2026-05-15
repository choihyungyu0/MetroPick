import type { EditableSavedReport } from './SavedReportsTab'

export const mockEditableSavedReports: EditableSavedReport[] = [
  {
    id: 'report-ai-sangmu-cafe',
    title: '상무역 AI 매출 예측 리포트',
    stationArea: '상무역',
    businessType: '카페/디저트',
    description: '개통 이후 유동인구 증가와 점심 수요를 기준으로 검토한 예측 리포트입니다.',
    tags: ['AI예측', '카페', '상무지구'],
    createdAt: '2026-05-15T09:30:00+09:00',
    recommendationScore: 92,
  },
  {
    id: 'report-commercial-baegun-restaurant',
    title: '백운광장역 상권 분석 리포트',
    stationArea: '백운광장역',
    businessType: '한식',
    description: '주거 배후 수요와 경쟁 점포 밀도를 함께 비교한 상권 분석 리포트입니다.',
    tags: ['상권분석', '한식', '주거상권'],
    createdAt: '2026-05-13T15:10:00+09:00',
    recommendationScore: 84,
  },
  {
    id: 'report-recommendation-uncheon-bakery',
    title: '운천역 입지 추천 리포트',
    stationArea: '운천역',
    businessType: '베이커리',
    description: '출퇴근 동선과 주변 생활 업종 조합을 기준으로 추천한 입지 리포트입니다.',
    tags: ['입지추천', '베이커리', '출퇴근'],
    createdAt: '2026-05-10T11:45:00+09:00',
    recommendationScore: 88,
  },
  {
    id: 'report-ai-ssangchon-convenience',
    title: '쌍촌역 AI 예측 리포트',
    stationArea: '쌍촌역',
    businessType: '편의점',
    description: '역세권 생활 인구와 야간 수요를 중심으로 살펴본 예측 리포트입니다.',
    tags: ['AI예측', '편의점', '생활인구'],
    createdAt: '2026-05-08T18:20:00+09:00',
  },
]
