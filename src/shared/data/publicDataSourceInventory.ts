export type PublicDataIntegrationStatus =
  | 'planned'
  | 'mocked'
  | 'needs-verification'
  | 'connected'

export type PublicDataFormat =
  | 'open-api'
  | 'csv'
  | 'xlsx'
  | 'json'
  | 'platform'
  | 'manual'

export type PublicDataSourceInventoryItem = {
  id: string
  sourceName: string
  provider: string
  format: PublicDataFormat[]
  expectedFields: string[]
  targetDomainModels: string[]
  targetPages: string[]
  integrationStatus: PublicDataIntegrationStatus
  notes: string
}

export const publicDataSourceInventory: PublicDataSourceInventoryItem[] = [
  {
    id: 'gwangju-bigdata-platform',
    sourceName: 'Gwangju Big Data Platform',
    provider: 'Gwangju Metropolitan City',
    format: ['platform', 'csv', 'json'],
    expectedFields: [
      'district',
      'commercial area',
      'population indicators',
      'sales indicators',
    ],
    targetDomainModels: ['CommercialAreaMetric', 'LocationRecommendation'],
    targetPages: ['/dashboard', '/commercial-analysis', '/recommendation'],
    integrationStatus: 'planned',
    notes: 'Use as a discovery source for local commercial district indicators.',
  },
  {
    id: 'gwangju-metro-ridership',
    sourceName: 'Gwangju transit ridership data',
    provider: 'Gwangju Transportation Corporation / Gwangju Metropolitan City',
    format: ['csv', 'xlsx', 'open-api'],
    expectedFields: [
      '기준일자',
      '역사명',
      '노선명',
      '시간대',
      '승차건수',
      '하차건수',
    ],
    targetDomainModels: ['NormalizedTransitRidership', 'CommercialAreaMetric'],
    targetPages: ['/dashboard', '/ai-prediction'],
    integrationStatus: 'planned',
    notes: 'Station-level ridership will help estimate floating population changes.',
  },
  {
    id: 'gwangju-bus-boarding-alighting',
    sourceName: 'Gwangju city bus boarding/alighting data',
    provider: 'Gwangju Metropolitan City',
    format: ['csv', 'xlsx', 'open-api'],
    expectedFields: [
      '기준일자',
      '노선명',
      '정류장명',
      '시간대',
      '승차건수',
      '하차건수',
    ],
    targetDomainModels: ['NormalizedBusRidership', 'CommercialAreaMetric'],
    targetPages: ['/dashboard', '/commercial-analysis', '/ai-prediction'],
    integrationStatus: 'mocked',
    notes: 'Fixture rows are mock examples only and are not official ridership data.',
  },
  {
    id: 'small-business-store-info',
    sourceName: 'Commercial store data',
    provider: 'Small Enterprise and Market Service / data.go.kr',
    format: ['csv', 'xlsx'],
    expectedFields: [
      '상가업소번호',
      '상호명',
      '상권업종대분류명',
      '상권업종소분류명',
      '시군구명',
      '도로명주소',
      '위도',
      '경도',
    ],
    targetDomainModels: ['NormalizedStore', 'CommercialAreaMetric'],
    targetPages: ['/commercial-analysis', '/recommendation'],
    integrationStatus: 'mocked',
    notes: 'Used for future store density and business category distribution metrics.',
  },
  {
    id: 'business-license-open-close',
    sourceName: 'Business license/open-close data',
    provider: 'Local administrative license data sources / data.go.kr',
    format: ['open-api', 'csv', 'xlsx'],
    expectedFields: [
      '관리번호',
      '사업장명',
      '업태구분명',
      '인허가일자',
      '폐업일자',
      '상세영업상태명',
      '시군구명',
    ],
    targetDomainModels: ['NormalizedBusinessLicense'],
    targetPages: ['/ai-prediction', '/report', '/mypage'],
    integrationStatus: 'mocked',
    notes: 'Future closure risk metrics should be derived from verified status fields.',
  },
  {
    id: 'commercial-growth-indicator',
    sourceName: 'Commercial growth indicator data',
    provider: 'Public commercial analysis datasets / local platforms',
    format: ['platform', 'csv', 'xlsx'],
    expectedFields: [
      '상권ID',
      '상권명',
      '매출증가율',
      '점포증가율',
      '유동인구증가율',
      '개업수',
      '폐업수',
      '성장지수',
    ],
    targetDomainModels: ['NormalizedCommercialGrowth', 'LocationRecommendation'],
    targetPages: ['/dashboard', '/recommendation', '/report'],
    integrationStatus: 'mocked',
    notes: 'Exact field names must be verified against the final source.',
  },
  {
    id: 'national-urban-railway-stations',
    sourceName: 'National urban railway station standard data',
    provider: 'Ministry of Land, Infrastructure and Transport / data.go.kr',
    format: ['open-api', 'csv', 'xlsx'],
    expectedFields: [
      '역번호',
      '역사명',
      '노선명',
      '환승역여부',
      '위도',
      '경도',
      '운영기관명',
      '도로명주소',
    ],
    targetDomainModels: ['NormalizedUrbanRailwayStation', 'StationArea'],
    targetPages: ['/onboarding/stations', '/commercial-analysis'],
    integrationStatus: 'needs-verification',
    notes: 'Use for station metadata verification after source schema review.',
  },
  {
    id: 'gwangju-metro-line-2-route-plan',
    sourceName: 'Gwangju Metro Line 2 route and planned station data',
    provider: 'Gwangju Metropolitan City / transit planning sources',
    format: ['manual', 'csv', 'xlsx'],
    expectedFields: [
      'station name',
      'line',
      'phase',
      'opening scenario',
      'latitude',
      'longitude',
    ],
    targetDomainModels: ['StationArea', 'PredictionScenario'],
    targetPages: ['/dashboard', '/commercial-analysis', '/ai-prediction'],
    integrationStatus: 'needs-verification',
    notes: 'Planned station coordinates and opening phases require official verification.',
  },
]
