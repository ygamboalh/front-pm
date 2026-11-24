import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  clearCashMovements,
  createCashMovement,
  deleteCashMovement,
  fetchCashMovements,
} from './api';

function useInvalidateCash() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
  };
}

export function useCashMovements() {
  return useQuery({
    queryKey: queryKeys.cash.all,
    queryFn: fetchCashMovements,
  });
}

export function useCreateCashMovement() {
  const invalidate = useInvalidateCash();

  return useMutation({
    mutationFn: createCashMovement,
    onSuccess: invalidate,
  });
}

export function useDeleteCashMovement() {
  const invalidate = useInvalidateCash();

  return useMutation({
    mutationFn: deleteCashMovement,
    onSuccess: invalidate,
  });
}

export function useClearCashMovements() {
  const invalidate = useInvalidateCash();

  return useMutation({
    mutationFn: clearCashMovements,
    onSuccess: invalidate,
  });
}
