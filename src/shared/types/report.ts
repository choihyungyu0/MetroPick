export type ReportCategory = '상권 분석' | 'AI 예측' | '입지 추천'

export type SavedReport = {
  id: string
  title: string
  category: ReportCategory
  stationArea: string
  businessType: string
  savedAt: string
  thumbnailSrc: string
}
