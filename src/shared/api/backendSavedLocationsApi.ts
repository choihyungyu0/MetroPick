import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendSavedLocationPayload = Record<string, unknown>

export type BackendSavedLocation = {
  business_type?: string | null
  created_at?: string | null
  district?: string | null
  id?: string | null
  payload?: BackendSavedLocationPayload | null
  score?: number | null
  station_name?: string | null
  user_id?: string | null
}

export type BackendSavedLocationsResponse = {
  data_status: string
  locations: BackendSavedLocation[]
}

export type BackendSavedLocationCreateInput = {
  business_type?: string | null
  district?: string | null
  payload?: BackendSavedLocationPayload
  score?: number | null
  station_name: string
}

export type BackendSavedLocationUpdateInput = {
  business_type?: string | null
  district?: string | null
  payload?: BackendSavedLocationPayload | null
  score?: number | null
  station_name?: string | null
}

export type BackendSavedLocationMutationResponse = {
  data_status: string
  location: BackendSavedLocation
}

export type BackendSavedLocationDeleteResponse = {
  data_status: string
  deleted: boolean
  id: string
}

export function fetchSavedLocations(): Promise<BackendSavedLocationsResponse> {
  return fetchBackendJson<BackendSavedLocationsResponse>('/api/saved-locations')
}

export function createSavedLocation(
  input: BackendSavedLocationCreateInput,
): Promise<BackendSavedLocationMutationResponse> {
  return fetchBackendJson<BackendSavedLocationMutationResponse>('/api/saved-locations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateSavedLocation(
  id: string,
  input: BackendSavedLocationUpdateInput,
): Promise<BackendSavedLocationMutationResponse> {
  return fetchBackendJson<BackendSavedLocationMutationResponse>(
    `/api/saved-locations/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export function deleteSavedLocation(
  id: string,
): Promise<BackendSavedLocationDeleteResponse> {
  return fetchBackendJson<BackendSavedLocationDeleteResponse>(
    `/api/saved-locations/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )
}
