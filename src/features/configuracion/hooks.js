import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchLatestConfiguration, saveConfiguration } from './api';

export function useConfiguration() {
  return useQuery({
    queryKey: queryKeys.configurations.current,
    queryFn: fetchLatestConfiguration,
    staleTime: 60 * 1000,
  });
}

export function useSaveConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveConfiguration,
    onSuccess: (configuration) => {
      queryClient.setQueryData(queryKeys.configurations.current, configuration);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      queryClient.invalidateQueries({ queryKey: queryKeys.configurations.all });
    },
  });
}
