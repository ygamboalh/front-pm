import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  closeShopping,
  createShopping,
  deleteShopping,
  fetchAllShoppingEncargos,
  fetchOpenShopping,
  fetchShoppingEncargoCounts,
  fetchShoppingEncargos,
  fetchShoppings,
  setShoppingClosed,
  updateShopping,
} from './api';

function useInvalidateShoppings() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.shoppings.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
    queryClient.invalidateQueries({ queryKey: queryKeys.encargos.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.shoppings.encargoCountsRoot });
  };
}

export function useShoppings(filters) {
  return useQuery({
    queryKey: queryKeys.shoppings.list(filters),
    queryFn: () => fetchShoppings(filters),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}

export function useOpenShopping() {
  return useQuery({
    queryKey: queryKeys.shoppings.open,
    queryFn: fetchOpenShopping,
    staleTime: 30 * 1000,
  });
}

export function useShoppingEncargos(shoppingId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.shoppings.encargos(shoppingId),
    queryFn: () => fetchShoppingEncargos(shoppingId),
    enabled: Boolean(shoppingId) && enabled,
    staleTime: 30 * 1000,
  });
}

export function useAllShoppingEncargos(shoppingId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.shoppings.encargosAll(shoppingId),
    queryFn: () => fetchAllShoppingEncargos(shoppingId),
    enabled: Boolean(shoppingId) && enabled,
    staleTime: 0,
  });
}

export function useShoppingEncargoCounts(shoppingIds = []) {
  const ids = [...new Set(shoppingIds.map(Number).filter(Boolean))].sort((a, b) => a - b);

  return useQuery({
    queryKey: queryKeys.shoppings.encargoCounts(ids),
    queryFn: () => fetchShoppingEncargoCounts(ids),
    enabled: ids.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useSaveShopping() {
  const invalidate = useInvalidateShoppings();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, values, configuration, oldId }) =>
      documentId
        ? updateShopping({ documentId, values, oldId })
        : createShopping(values, configuration),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppings.open });
    },
  });
}

export function useCloseShopping() {
  const invalidate = useInvalidateShoppings();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeShopping,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppings.open });
    },
  });
}

export function useToggleShoppingClosed() {
  const invalidate = useInvalidateShoppings();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setShoppingClosed,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppings.open });
    },
  });
}

export function useDeleteShopping() {
  const invalidate = useInvalidateShoppings();

  return useMutation({
    mutationFn: deleteShopping,
    onSuccess: invalidate,
  });
}
