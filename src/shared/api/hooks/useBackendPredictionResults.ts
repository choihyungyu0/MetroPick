import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createPredictionResult,
  deletePredictionResult,
  fetchPredictionResults,
  updatePredictionResult,
  type BackendPredictionResultCreateInput,
  type BackendPredictionResultUpdateInput,
} from '@/shared/api/backendPredictionResultsApi'

export const backendPredictionResultsQueryKey = [
  'backend-prediction-results',
] as const

export function useBackendPredictionResults() {
  return useQuery({
    queryKey: backendPredictionResultsQueryKey,
    queryFn: fetchPredictionResults,
    retry: false,
  })
}

export function useCreateBackendPredictionResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BackendPredictionResultCreateInput) =>
      createPredictionResult(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendPredictionResultsQueryKey }),
  })
}

export function useUpdateBackendPredictionResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: BackendPredictionResultUpdateInput
    }) => updatePredictionResult(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendPredictionResultsQueryKey }),
  })
}

export function useDeleteBackendPredictionResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePredictionResult(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: backendPredictionResultsQueryKey }),
  })
}
