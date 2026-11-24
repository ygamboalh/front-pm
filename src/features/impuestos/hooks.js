import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { deleteTax, fetchTaxes, saveTax } from './api';

function useInvalidateTaxes() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.taxes.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
  };
}

export function useTaxes(filters) {
  return useQuery({
    queryKey: queryKeys.taxes.list(filters),
    queryFn: () => fetchTaxes(filters),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}

export function useSaveTax() {
  const invalidate = useInvalidateTaxes();

  return useMutation({
    mutationFn: saveTax,
    onSuccess: invalidate,
  });
}

export function useDeleteTax() {
  const invalidate = useInvalidateTaxes();

  return useMutation({
    mutationFn: deleteTax,
    onSuccess: invalidate,
  });
}
