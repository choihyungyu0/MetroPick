import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createNotificationSettings,
  deleteNotificationSettings,
  fetchNotificationSettings,
  updateNotificationSettings,
  type BackendNotificationSettingsCreateInput,
  type BackendNotificationSettingsUpdateInput,
} from '@/shared/api/backendNotificationSettingsApi'

export const backendNotificationSettingsQueryKey = [
  'backend-notification-settings',
] as const

export function useBackendNotificationSettings() {
  return useQuery({
    queryKey: backendNotificationSettingsQueryKey,
    queryFn: fetchNotificationSettings,
    retry: false,
  })
}

export function useCreateBackendNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BackendNotificationSettingsCreateInput) =>
      createNotificationSettings(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: backendNotificationSettingsQueryKey,
      }),
  })
}

export function useUpdateBackendNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: BackendNotificationSettingsUpdateInput
    }) => updateNotificationSettings(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: backendNotificationSettingsQueryKey,
      }),
  })
}

export function useDeleteBackendNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteNotificationSettings(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: backendNotificationSettingsQueryKey,
      }),
  })
}
