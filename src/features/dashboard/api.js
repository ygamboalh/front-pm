import { strapiClient } from '@/shared/api/strapiClient';
import { normalizeConfiguration } from '@/features/configuracion/api';

const PENDING_FILTER = { 'filters[deliveredStatus][$ne]': 'Entregado' };
const DELIVERED_FILTER = { 'filters[deliveredStatus][$eq]': 'Entregado' };

export async function fetchDashboardOverview() {
  const [configurations, openShoppings, pendingEncargos, totalEncargos, deliveredEncargos] =
    await Promise.all([
      strapiClient.get('/api/configurations', {
        params: {
          'pagination[pageSize]': 1,
          sort: 'configCreatedAt:desc',
        },
      }),
      strapiClient.get('/api/shoppings', {
        params: {
          'filters[isClosed][$eq]': false,
          'pagination[pageSize]': 1,
          sort: 'shoppingCreatedAt:desc',
        },
      }),
      strapiClient.get('/api/encargos', {
        params: {
          ...PENDING_FILTER,
          'pagination[pageSize]': 5,
          sort: 'encargoCreatedAt:desc',
        },
      }),
      strapiClient.get('/api/encargos', {
        params: { 'pagination[pageSize]': 1 },
      }),
      strapiClient.get('/api/encargos', {
        params: { ...DELIVERED_FILTER, 'pagination[pageSize]': 1 },
      }),
    ]);

  return {
    configuration: normalizeConfiguration(configurations.data.data?.[0] ?? null),
    openShopping: openShoppings.data.data?.[0] ?? null,
    pendingEncargos: pendingEncargos.data.data ?? [],
    counts: {
      total: totalEncargos.data.meta?.pagination?.total ?? 0,
      pending: pendingEncargos.data.meta?.pagination?.total ?? 0,
      delivered: deliveredEncargos.data.meta?.pagination?.total ?? 0,
    },
  };
}
