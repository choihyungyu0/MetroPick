export type CommercialAnalysisSummaryCard = {
  change: string
  desc: string
  title: string
  value: string
}

export type CommercialDistributionItem = {
  color: string
  count: string
  name: string
  percent: string
}

export type StationComparisonRow = {
  averageFloatingPopulation: string
  averageMonthlySales: string
  competitionLevel: string
  densityLevel: string
  densityTone: 'danger' | 'warning' | 'normal'
  promisingBusinessTypes: string[]
  station: string
  storeCount: number
}

export const commercialAnalysisSummaryCards: CommercialAnalysisSummaryCard[] = [
  { title: '총 점포 수', value: '12,843개', change: '+8.7%', desc: '전월 대비' },
  { title: '업종 수', value: '96개', change: '+3개', desc: '전월 대비' },
  {
    title: '평균 유동인구 (주간)',
    value: '125,430명',
    change: '+12.3%',
    desc: '전월 대비',
  },
  { title: '경쟁 강도 (평균)', value: '보통', change: '2.8 / 5.0', desc: '' },
]

export const commercialDistribution: CommercialDistributionItem[] = [
  { name: '음식점', percent: '36.2%', count: '4,650', color: '#2563eb' },
  { name: '카페/디저트', percent: '17.8%', count: '2,287', color: '#14b8a6' },
  { name: '소매', percent: '15.4%', count: '1,978', color: '#8b5cf6' },
  { name: '생활서비스', percent: '12.1%', count: '1,552', color: '#ef4444' },
  { name: '학원', percent: '8.7%', count: '1,116', color: '#fbbf24' },
  { name: '기타', percent: '9.8%', count: '1,260', color: '#94a3b8' },
]

export const stationComparisonRows: StationComparisonRow[] = [
  {
    station: '상무역',
    storeCount: 1842,
    densityLevel: '매우 높음',
    densityTone: 'danger',
    averageFloatingPopulation: '28,560명',
    averageMonthlySales: '28,430만원',
    competitionLevel: '높음 4.2/5',
    promisingBusinessTypes: ['카페', '음식점'],
  },
  {
    station: '백운광장역',
    storeCount: 1234,
    densityLevel: '높음',
    densityTone: 'warning',
    averageFloatingPopulation: '22,410명',
    averageMonthlySales: '23,120만원',
    competitionLevel: '보통 3.1/5',
    promisingBusinessTypes: ['카페/디저트', '생활서비스'],
  },
  {
    station: '광주역',
    storeCount: 981,
    densityLevel: '보통',
    densityTone: 'normal',
    averageFloatingPopulation: '19,870명',
    averageMonthlySales: '20,540만원',
    competitionLevel: '보통 2.9/5',
    promisingBusinessTypes: ['음식점', '편의점'],
  },
  {
    station: '전남대역',
    storeCount: 876,
    densityLevel: '보통',
    densityTone: 'normal',
    averageFloatingPopulation: '18,430명',
    averageMonthlySales: '19,870만원',
    competitionLevel: '낮음 2.1/5',
    promisingBusinessTypes: ['생활서비스', '소매'],
  },
]

export const commercialAnalysisTabs = [
  '핵심 역세권 비교',
  '업종 분포',
  '유동인구',
  '매출 현황',
  '경쟁도',
  '상권 변화 추이',
]
