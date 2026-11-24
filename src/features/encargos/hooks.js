import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  deleteEncargo,
  fetchEncargos,
  markEncargoDelivered,
  saveEncargo,
} from './api';

function useInvalidateEncargos() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.encargos.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
    queryClient.invalidateQueries({ queryKey: queryKeys.shoppings.encargoCountsRoot });
  };
}

export function useEncargos(filters) {
  return useQuery({
    queryKey: queryKeys.encargos.list(filters),
    queryFn: () => fetchEncargos(filters),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}

export function useSaveEncargo() {
  const invalidate = useInvalidateEncargos();

  return useMutation({
    mutationFn: saveEncargo,
    onSuccess: invalidate,
  });
}

export function useDeleteEncargo() {
  const invalidate = useInvalidateEncargos();

  return useMutation({
    mutationFn: deleteEncargo,
    onSuccess: invalidate,
  });
}

export function useMarkEncargoDelivered() {
  const invalidate = useInvalidateEncargos();

  return useMutation({
    mutationFn: markEncargoDelivered,
    onSuccess: invalidate,
  });
}
