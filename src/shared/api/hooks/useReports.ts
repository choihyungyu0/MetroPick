import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getCurrentReport,
  getSavedReports,
  saveReport,
} from '@/shared/api/reportApi'

export function useSavedReports() {
  return useQuery({
    queryKey: ['saved-reports'],
    queryFn: getSavedReports,
  })
}

export function useCurrentReport() {
  return useQuery({
    queryKey: ['current-report'],
    queryFn: getCurrentReport,
  })
}

export function useSaveReport() {
  return useMutation({
    mutationFn: saveReport,
  })
}
