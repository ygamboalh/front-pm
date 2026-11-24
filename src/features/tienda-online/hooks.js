import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchStorefront } from './api';

export function useStorefront() {
  return useQuery({
    queryKey: queryKeys.storefront.all,
    queryFn: fetchStorefront,
    staleTime: 60 * 1000,
  });
}
