import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendNotificationQuietHours = Record<string, unknown>

export type BackendNotificationSetting = {
  channels?: string[] | null
  created_at?: string | null
  enabled_notifications?: string[] | null
  frequency?: string | null
  id?: string | null
  quiet_hours?: BackendNotificationQuietHours | null
  user_id?: string | null
}

export type BackendNotificationSettingsResponse = {
  data_status: string
  settings: BackendNotificationSetting[]
}

export type BackendNotificationSettingsCreateInput = {
  channels?: string[]
  enabled_notifications?: string[]
  frequency?: string
  quiet_hours?: BackendNotificationQuietHours
}

export type BackendNotificationSettingsUpdateInput = {
  channels?: string[] | null
  enabled_notifications?: string[] | null
  frequency?: string | null
  quiet_hours?: BackendNotificationQuietHours | null
}

export type BackendNotificationSettingsMutationResponse = {
  data_status: string
  setting: BackendNotificationSetting
}

export type BackendNotificationSettingsDeleteResponse = {
  data_status: string
  deleted: boolean
  id: string
}

export function fetchNotificationSettings(): Promise<BackendNotificationSettingsResponse> {
  return fetchBackendJson<BackendNotificationSettingsResponse>(
    '/api/notification-settings',
  )
}

export function createNotificationSettings(
  input: BackendNotificationSettingsCreateInput,
): Promise<BackendNotificationSettingsMutationResponse> {
  return fetchBackendJson<BackendNotificationSettingsMutationResponse>(
    '/api/notification-settings',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export function updateNotificationSettings(
  id: string,
  input: BackendNotificationSettingsUpdateInput,
): Promise<BackendNotificationSettingsMutationResponse> {
  return fetchBackendJson<BackendNotificationSettingsMutationResponse>(
    `/api/notification-settings/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export function deleteNotificationSettings(
  id: string,
): Promise<BackendNotificationSettingsDeleteResponse> {
  return fetchBackendJson<BackendNotificationSettingsDeleteResponse>(
    `/api/notification-settings/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )
}
