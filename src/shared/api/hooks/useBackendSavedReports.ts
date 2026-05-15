import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createSavedReport,
  deleteSavedReport,
  fetchSavedReports,
  updateSavedReport,
  type BackendSavedReportCreateInput,
  type BackendSavedReportUpdateInput,
} from '@/shared/api/backendSavedReportsApi'

export const backendSavedReportsQueryKey = ['backend-saved-reports'] as const

export function useBackendSavedReports() {
  return useQuery({
    queryKey: backendSavedReportsQueryKey,
    queryFn: fetchSavedReports,
    retry: false,
  })
}

export function useCreateBackendSavedReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BackendSavedReportCreateInput) => createSavedReport(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendSavedReportsQueryKey }),
  })
}

export function useUpdateBackendSavedReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: BackendSavedReportUpdateInput
    }) => updateSavedReport(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendSavedReportsQueryKey }),
  })
}

export function useDeleteBackendSavedReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSavedReport(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendSavedReportsQueryKey }),
  })
}
