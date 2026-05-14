import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendHealthResponse = {
  status: string
  data_status: string
}

export function getBackendHealth(): Promise<BackendHealthResponse> {
  return fetchBackendJson<BackendHealthResponse>('/health')
}
