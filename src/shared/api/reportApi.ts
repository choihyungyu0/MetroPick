import { mockSavedReports } from '@/shared/data/mockReports'
import { safeParseStorage } from '@/shared/lib/storage'
import type { SavedReport } from '@/shared/types/report'

import { appendStorageItem, readStorageList, withMockDelay } from './publicDataClient'

const SAVED_REPORTS_STORAGE_KEY = 'metropick-saved-commercial-analysis-reports'
const CURRENT_REPORT_STORAGE_KEY = 'metropick-current-report'

function readCurrentReport(): SavedReport | null {
  const parsed = safeParseStorage<unknown>(CURRENT_REPORT_STORAGE_KEY)

  if (!parsed || typeof parsed !== 'object') {
    return null
  }

  const report = parsed as Partial<SavedReport>

  if (!report.id || !report.title || !report.stationArea || !report.businessType) {
    return null
  }

  return {
    id: report.id,
    title: report.title,
    category: report.category ?? 'AI 예측',
    stationArea: report.stationArea,
    businessType: report.businessType,
    savedAt: report.savedAt ?? new Date().toISOString(),
    thumbnailSrc: report.thumbnailSrc ?? '/assets/report/report-station-hero.png',
  }
}

export function getSavedReports(): Promise<SavedReport[]> {
  return withMockDelay([
    ...mockSavedReports,
    ...readStorageList<SavedReport>(SAVED_REPORTS_STORAGE_KEY),
  ])
}

export function saveReport(report: SavedReport): Promise<SavedReport> {
  appendStorageItem<SavedReport>(SAVED_REPORTS_STORAGE_KEY, report)

  return withMockDelay(report)
}

export function getCurrentReport(): Promise<SavedReport | null> {
  return withMockDelay(readCurrentReport())
}
