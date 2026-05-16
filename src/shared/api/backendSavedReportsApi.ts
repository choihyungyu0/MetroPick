import { fetchBackendJson } from '@/shared/api/backendClient'
import { buildUserScopedPath, withBackendUserId } from '@/shared/api/backendUserScope'

export type BackendSavedReportPayload = Record<string, unknown>

export type BackendSavedReport = {
  business_type?: string | null
  created_at?: string | null
  id?: string | null
  payload?: BackendSavedReportPayload | null
  report_type?: string | null
  station_area?: string | null
  title?: string | null
  user_id?: string | null
}

export type BackendSavedReportsResponse = {
  data_status: string
  reports: BackendSavedReport[]
}

export type BackendSavedReportCreateInput = {
  business_type?: string | null
  payload?: BackendSavedReportPayload
  report_type: string
  station_area?: string | null
  title: string
  user_id?: string | null
}

export type BackendSavedReportUpdateInput = {
  business_type?: string | null
  payload?: BackendSavedReportPayload | null
  station_area?: string | null
  title?: string | null
  user_id?: string | null
}

export type BackendSavedReportMutationResponse = {
  data_status: string
  report: BackendSavedReport
}

export type BackendSavedReportDeleteResponse = {
  data_status: string
  deleted: boolean
  id: string
}

export function fetchSavedReports(): Promise<BackendSavedReportsResponse> {
  return fetchBackendJson<BackendSavedReportsResponse>(
    buildUserScopedPath('/api/saved-reports'),
  )
}

export function createSavedReport(
  input: BackendSavedReportCreateInput,
): Promise<BackendSavedReportMutationResponse> {
  return fetchBackendJson<BackendSavedReportMutationResponse>('/api/saved-reports', {
    method: 'POST',
    body: JSON.stringify(withBackendUserId(input)),
  })
}

export function updateSavedReport(
  id: string,
  input: BackendSavedReportUpdateInput,
): Promise<BackendSavedReportMutationResponse> {
  return fetchBackendJson<BackendSavedReportMutationResponse>(
    `/api/saved-reports/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(withBackendUserId(input)),
    },
  )
}

export function deleteSavedReport(
  id: string,
): Promise<BackendSavedReportDeleteResponse> {
  return fetchBackendJson<BackendSavedReportDeleteResponse>(
    `/api/saved-reports/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )
}
