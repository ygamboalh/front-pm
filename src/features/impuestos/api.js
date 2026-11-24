import { strapiClient } from '@/shared/api/strapiClient';
import { uploadFile } from '@/shared/api/upload';

function toDateTime(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toTaxPayload(values, imageId) {
  return {
    taxCreatedAt: toDateTime(values.taxCreatedAt),
    description: values.description?.trim() || null,
    screenShotImage: imageId,
    month: values.month.trim(),
    code: values.code.trim(),
    amount: Math.round(Number(values.amount) || 0),
    realPaid: Number(values.realPaid) || 0,
    paymentDate: toDateTime(values.paymentDate),
    gain: Math.round(Number(values.gain) || 0),
  };
}

export async function fetchTaxes({ page = 1, pageSize = 10, search = '' } = {}) {
  const params = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    sort: 'paymentDate:desc',
    populate: 'screenShotImage',
  };

  const term = search.trim();
  if (term) {
    params['filters[$or][0][description][$containsi]'] = term;
    params['filters[$or][1][month][$containsi]'] = term;
    params['filters[$or][2][code][$containsi]'] = term;
  }

  const { data } = await strapiClient.get('/api/taxes', { params });

  return {
    items: data.data ?? [],
    meta: data.meta?.pagination ?? { page, pageSize, pageCount: 1, total: 0 },
  };
}

export async function saveTax({ documentId, values, imageFile, currentImageId }) {
  const imageId = imageFile ? (await uploadFile(imageFile)).id : currentImageId;

  if (!imageId) {
    throw new Error('El comprobante del impuesto es obligatorio');
  }

  const payload = toTaxPayload(values, Number(imageId));

  if (documentId) {
    const { data } = await strapiClient.put(
      `/api/taxes/${documentId}`,
      { data: payload },
      { params: { status: 'published' } },
    );
    return data.data;
  }

  const { data } = await strapiClient.post(
    '/api/taxes',
    { data: payload },
    { params: { status: 'published' } },
  );

  return data.data;
}

export async function deleteTax(documentId) {
  const { data } = await strapiClient.delete(`/api/taxes/${documentId}`);
  return data?.data ?? null;
}
