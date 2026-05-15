import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendOnboardingNotificationSettings = Record<string, unknown>

export type BackendOnboardingSetting = {
  created_at?: string | null
  id?: string | null
  notification_settings?: BackendOnboardingNotificationSettings | null
  radius?: string | null
  region?: string | null
  selected_business_types?: string[] | null
  selected_stations?: string[] | null
  user_id?: string | null
}

export type BackendOnboardingSettingsResponse = {
  data_status: string
  settings: BackendOnboardingSetting[]
}

export type BackendOnboardingSettingsCreateInput = {
  notification_settings?: BackendOnboardingNotificationSettings
  radius?: string
  region?: string | null
  selected_business_types?: string[]
  selected_stations?: string[]
}

export type BackendOnboardingSettingsUpdateInput = {
  notification_settings?: BackendOnboardingNotificationSettings | null
  radius?: string | null
  region?: string | null
  selected_business_types?: string[] | null
  selected_stations?: string[] | null
}

export type BackendOnboardingSettingsMutationResponse = {
  data_status: string
  setting: BackendOnboardingSetting
}

export type BackendOnboardingSettingsDeleteResponse = {
  data_status: string
  deleted: boolean
  id: string
}

export function fetchOnboardingSettings(): Promise<BackendOnboardingSettingsResponse> {
  return fetchBackendJson<BackendOnboardingSettingsResponse>(
    '/api/onboarding-settings',
  )
}

export function createOnboardingSettings(
  input: BackendOnboardingSettingsCreateInput,
): Promise<BackendOnboardingSettingsMutationResponse> {
  return fetchBackendJson<BackendOnboardingSettingsMutationResponse>(
    '/api/onboarding-settings',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export function updateOnboardingSettings(
  id: string,
  input: BackendOnboardingSettingsUpdateInput,
): Promise<BackendOnboardingSettingsMutationResponse> {
  return fetchBackendJson<BackendOnboardingSettingsMutationResponse>(
    `/api/onboarding-settings/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export function deleteOnboardingSettings(
  id: string,
): Promise<BackendOnboardingSettingsDeleteResponse> {
  return fetchBackendJson<BackendOnboardingSettingsDeleteResponse>(
    `/api/onboarding-settings/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )
}
