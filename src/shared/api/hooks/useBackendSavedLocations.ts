import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createSavedLocation,
  deleteSavedLocation,
  fetchSavedLocations,
  updateSavedLocation,
  type BackendSavedLocationCreateInput,
  type BackendSavedLocationUpdateInput,
} from '@/shared/api/backendSavedLocationsApi'

export const backendSavedLocationsQueryKey = ['backend-saved-locations'] as const

export function useBackendSavedLocations() {
  return useQuery({
    queryKey: backendSavedLocationsQueryKey,
    queryFn: fetchSavedLocations,
    retry: false,
  })
}

export function useCreateBackendSavedLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BackendSavedLocationCreateInput) =>
      createSavedLocation(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendSavedLocationsQueryKey }),
  })
}

export function useUpdateBackendSavedLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: BackendSavedLocationUpdateInput
    }) => updateSavedLocation(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendSavedLocationsQueryKey }),
  })
}

export function useDeleteBackendSavedLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSavedLocation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendSavedLocationsQueryKey }),
  })
}
