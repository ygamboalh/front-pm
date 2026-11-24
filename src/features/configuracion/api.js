import { strapiClient } from '@/shared/api/strapiClient';

const INTEGER_FIELDS = [
  'usdPrice',
  'totalGain',
  'totalEncargos',
  'pendingEncargos',
  'deliveredEncargos',
  'totalShippingSpent',
  'totalBuySpent',
  'gainPercentForBusiness',
  'transferPercent',
];

const DECIMAL_FIELDS = ['poundPrice', 'totalWeight'];
const STRING_FIELDS = ['contactPhone'];

export function normalizeConfiguration(entry) {
  if (!entry) return null;

  const normalized = {
    documentId: entry.documentId,
    configCreatedAt: entry.configCreatedAt ?? null,
    updatedAt: entry.updatedAt ?? null,
    publishedAt: entry.publishedAt ?? null,
  };

  for (const field of INTEGER_FIELDS) {
    normalized[field] = Math.round(Number(entry[field]) || 0);
  }

  for (const field of DECIMAL_FIELDS) {
    normalized[field] = Number(entry[field]) || 0;
  }

  for (const field of STRING_FIELDS) {
    normalized[field] = entry[field] ?? '';
  }

  return normalized;
}

export async function fetchLatestConfiguration() {
  const { data } = await strapiClient.get('/api/configurations', {
    params: {
      'pagination[pageSize]': 1,
      sort: 'configCreatedAt:desc',
    },
  });

  return normalizeConfiguration(data.data?.[0] ?? null);
}

function buildPayload(values, current) {
  return {
    configCreatedAt: current?.configCreatedAt || new Date().toISOString(),
    usdPrice: Math.round(Number(values.usdPrice) || 0),
    poundPrice: Number(values.poundPrice) || 0,
    gainPercentForBusiness: Math.round(Number(values.gainPercentForBusiness) || 0),
    transferPercent: Math.round(Number(values.transferPercent) || 0),
    totalGain: current?.totalGain ?? 0,
    totalEncargos: current?.totalEncargos ?? 0,
    pendingEncargos: current?.pendingEncargos ?? 0,
    deliveredEncargos: current?.deliveredEncargos ?? 0,
    totalShippingSpent: current?.totalShippingSpent ?? 0,
    totalWeight: current?.totalWeight ?? 0,
    totalBuySpent: current?.totalBuySpent ?? 0,
    contactPhone: String(values.contactPhone ?? current?.contactPhone ?? '').trim(),
  };
}

/**
 * Crea o actualiza la configuración. En Strapi v5 las entradas creadas con
 * draftAndPublish se publican pasando ?status=published.
 */
export async function saveConfiguration({ documentId, values, current }) {
  const payload = buildPayload(values, current);

  if (documentId) {
    const { data } = await strapiClient.put(
      `/api/configurations/${documentId}`,
      { data: payload },
      { params: { status: 'published' } },
    );

    return normalizeConfiguration(data.data);
  }

  const { data } = await strapiClient.post(
    '/api/configurations',
    { data: payload },
    { params: { status: 'published' } },
  );

  return normalizeConfiguration(data.data);
}
