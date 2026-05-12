export type DashboardKpiTone = 'blue' | 'green' | 'orange' | 'red'

export type DashboardKpi = {
  caption: string
  change: string
  iconKey: 'users' | 'wallet' | 'store' | 'alert'
  id: string
  label: string
  tone: DashboardKpiTone
  value: string
}

export type RecommendedStation = {
  rank: number
  score: number
  station: string
  strengths: string[]
}

export type BusinessPotential = {
  businessType: string
  percentage: string
  value: string
}

export type DashboardReport = {
  date: string
  location: string
  tag: string
  title: string
}

export type DashboardInsight = {
  iconKey: 'target' | 'building' | 'alert'
  id: string
  message: string
  tone: 'green' | 'blue' | 'red'
  title: string
}

export type DashboardNotice = {
  description: string
  label: string
  title: string
  type: 'danger' | 'warning' | 'info'
}

export const dashboardKpis: DashboardKpi[] = [
  {
    id: 'floating-population',
    label: '유동인구 예측',
    value: '125,430명',
    change: '+12.4%',
    caption: '전월 대비',
    iconKey: 'users',
    tone: 'blue',
  },
  {
    id: 'sales-potential',
    label: '매출 잠재력',
    value: '2,845억 원',
    change: '+8.7%',
    caption: '전월 대비',
    iconKey: 'wallet',
    tone: 'green',
  },
  {
    id: 'startup-opportunity',
    label: '신규 창업 기회',
    value: '1,203개',
    change: '+15.3%',
    caption: '전월 대비',
    iconKey: 'store',
    tone: 'orange',
  },
  {
    id: 'risk-stations',
    label: '주의 필요 역세권',
    value: '7개',
    change: '+2개',
    caption: '전월 대비',
    iconKey: 'alert',
    tone: 'red',
  },
]

export const recommendedStations: RecommendedStation[] = [
  {
    rank: 1,
    station: '상무역',
    score: 92.4,
    strengths: ['유동인구 증가', '상권 성장성', '접근성'],
  },
  {
    rank: 2,
    station: '첨단역',
    score: 89.1,
    strengths: ['개발 호재', '업종 다양성', '임대료 안정성'],
  },
  {
    rank: 3,
    station: '시청역',
    score: 86.7,
    strengths: ['유입인구 규모', '행정 중심', '브랜드 적합도'],
  },
  {
    rank: 4,
    station: '금남로5가역',
    score: 84.2,
    strengths: ['관광객 유입', '상권 활성도', '배후지 수요'],
  },
  {
    rank: 5,
    station: '동명역',
    score: 81.3,
    strengths: ['MZ 상권', '카페 성업률', '성장성'],
  },
]

export const businessPotentials: BusinessPotential[] = [
  { businessType: '음식점', value: '845억 원', percentage: '29.7%' },
  { businessType: '카페/디저트', value: '512억 원', percentage: '18.0%' },
  { businessType: '편의점', value: '376억 원', percentage: '13.2%' },
  { businessType: '헬스/뷰티', value: '298억 원', percentage: '10.5%' },
  { businessType: '의류/패션', value: '287억 원', percentage: '10.1%' },
]

export const dashboardReports: DashboardReport[] = [
  {
    title: '상무역 상권 분석 리포트',
    location: '광주 서구 상무대로 일대',
    date: '2025.05.19',
    tag: '상세 분석',
  },
  {
    title: '첨단역 입지 추천 보고서',
    location: '광주 광산구 첨단중앙로 일대',
    date: '2025.05.18',
    tag: '입지 추천',
  },
  {
    title: '동명역 카페 창업 타당성 분석',
    location: '광주 동구 동명로 일대',
    date: '2025.05.17',
    tag: 'AI 예측',
  },
]

export const dashboardInsights: DashboardInsight[] = [
  {
    id: 'sangmu-population',
    iconKey: 'target',
    tone: 'green',
    title: '상무역 인근 유동인구가 전월 대비 18.7% 증가했습니다.',
    message:
      '상무지구 개발 호재와 행사 영향으로 유동인구 증가세가 지속될 것으로 예상됩니다.',
  },
  {
    id: 'restaurant-potential',
    iconKey: 'building',
    tone: 'blue',
    title: '음식점 업종의 매출 잠재력이 가장 높게 나타났습니다.',
    message: '특히 한식/분식과 프랜차이즈 업종의 성장 가능성이 높게 분석되었습니다.',
  },
  {
    id: 'risk-signal',
    iconKey: 'alert',
    tone: 'red',
    title: '7개 역세권에서 주의가 필요한 신호가 감지되었습니다.',
    message: '임대료 상승률 대비 매출 성장률이 낮은 지역을 확인해보세요.',
  },
]

export const dashboardNotices: DashboardNotice[] = [
  {
    label: '경고',
    title: '금남로5가역 인근 임대료가 급상승 중입니다.',
    description: '전월 대비 15.2% 상승 (2025.05.20)',
    type: 'danger',
  },
  {
    label: '주의',
    title: '동명역 상권의 경쟁 강도가 높아졌습니다.',
    description: '동종업종 밀집도 78% (전월 대비 +12%)',
    type: 'warning',
  },
  {
    label: '정보',
    title: '광주 2호선 연계 버스 노선이 변경되었습니다.',
    description: '5개 노선 변경 (2025.05.18)',
    type: 'info',
  },
]
