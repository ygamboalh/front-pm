import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  assignProductToVendor,
  deleteProduct,
  fetchProductStats,
  fetchProductTypes,
  fetchProducts,
  fetchSalesSummary,
  markProductSold,
  registerSaleInCash,
  returnProductToStore,
  saveProduct,
} from './api';

function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
  };
}

export function useProducts(filters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}

export function useProductStats(status, options = {}) {
  return useQuery({
    queryKey: queryKeys.products.stats(status),
    queryFn: () => fetchProductStats(status),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useProductTypes() {
  return useQuery({
    queryKey: queryKeys.types.all,
    queryFn: fetchProductTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesSummary() {
  return useQuery({
    queryKey: queryKeys.products.salesSummary,
    queryFn: fetchSalesSummary,
    staleTime: 30 * 1000,
  });
}

export function useAssignProductToVendor() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: assignProductToVendor,
    onSuccess: invalidate,
  });
}

export function useSaveProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: saveProduct,
    onSuccess: invalidate,
  });
}

export function useMarkProductSold() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: markProductSold,
    onSuccess: invalidate,
  });
}

export function useRegisterSaleInCash() {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerSaleInCash,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    },
  });
}

export function useReturnProductToStore() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: returnProductToStore,
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: invalidate,
  });
}
