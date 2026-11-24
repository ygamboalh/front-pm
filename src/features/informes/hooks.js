import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchReportData } from './api';

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: fetchReportData,
  });
}
