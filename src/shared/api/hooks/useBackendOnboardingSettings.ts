import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createOnboardingSettings,
  deleteOnboardingSettings,
  fetchOnboardingSettings,
  updateOnboardingSettings,
  type BackendOnboardingSettingsCreateInput,
  type BackendOnboardingSettingsUpdateInput,
} from '@/shared/api/backendOnboardingSettingsApi'

export const backendOnboardingSettingsQueryKey = [
  'backend-onboarding-settings',
] as const

export function useBackendOnboardingSettings() {
  return useQuery({
    queryKey: backendOnboardingSettingsQueryKey,
    queryFn: fetchOnboardingSettings,
    retry: false,
  })
}

export function useCreateBackendOnboardingSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BackendOnboardingSettingsCreateInput) =>
      createOnboardingSettings(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: backendOnboardingSettingsQueryKey,
      }),
  })
}

export function useUpdateBackendOnboardingSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: BackendOnboardingSettingsUpdateInput
    }) => updateOnboardingSettings(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: backendOnboardingSettingsQueryKey,
      }),
  })
}

export function useDeleteBackendOnboardingSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteOnboardingSettings(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: backendOnboardingSettingsQueryKey,
      }),
  })
}
