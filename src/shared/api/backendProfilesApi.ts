import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendProfile = {
  created_at?: string | null
  email: string
  id?: string | null
  name: string
  plan?: string | null
  role: string
}

export type BackendProfileCreateInput = {
  email: string
  name: string
  plan?: string
  role: string
}

export type BackendProfileMutationResponse = {
  data_status: string
  profile: BackendProfile | null
}

export function createProfile(
  input: BackendProfileCreateInput,
): Promise<BackendProfileMutationResponse> {
  return fetchBackendJson<BackendProfileMutationResponse>('/api/profiles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
