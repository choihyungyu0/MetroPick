import { fetchBackendJson } from '@/shared/api/backendClient'
import { buildUserScopedPath, withBackendUserId } from '@/shared/api/backendUserScope'

export type BackendPredictionResultPayload = Record<string, unknown>

export type BackendPredictionResult = {
  business_type?: string | null
  created_at?: string | null
  id?: string | null
  predicted_score?: number | null
  result_payload?: BackendPredictionResultPayload | null
  station_area?: string | null
  user_id?: string | null
}

export type BackendPredictionResultsResponse = {
  data_status: string
  results: BackendPredictionResult[]
}

export type BackendPredictionResultCreateInput = {
  business_type?: string | null
  predicted_score?: number | null
  result_payload?: BackendPredictionResultPayload
  station_area: string
  user_id?: string | null
}

export type BackendPredictionResultUpdateInput = {
  business_type?: string | null
  predicted_score?: number | null
  result_payload?: BackendPredictionResultPayload | null
  station_area?: string | null
  user_id?: string | null
}

export type BackendPredictionResultMutationResponse = {
  data_status: string
  result: BackendPredictionResult
}

export type BackendPredictionResultDeleteResponse = {
  data_status: string
  deleted: boolean
  id: string
}

export function fetchPredictionResults(): Promise<BackendPredictionResultsResponse> {
  return fetchBackendJson<BackendPredictionResultsResponse>(
    buildUserScopedPath('/api/prediction-results'),
  )
}

export function createPredictionResult(
  input: BackendPredictionResultCreateInput,
): Promise<BackendPredictionResultMutationResponse> {
  return fetchBackendJson<BackendPredictionResultMutationResponse>(
    '/api/prediction-results',
    {
      method: 'POST',
      body: JSON.stringify(withBackendUserId(input)),
    },
  )
}

export function updatePredictionResult(
  id: string,
  input: BackendPredictionResultUpdateInput,
): Promise<BackendPredictionResultMutationResponse> {
  return fetchBackendJson<BackendPredictionResultMutationResponse>(
    `/api/prediction-results/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(withBackendUserId(input)),
    },
  )
}

export function deletePredictionResult(
  id: string,
): Promise<BackendPredictionResultDeleteResponse> {
  return fetchBackendJson<BackendPredictionResultDeleteResponse>(
    `/api/prediction-results/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )
}
