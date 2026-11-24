import { strapiClient } from '@/shared/api/strapiClient';
import { uploadFile } from '@/shared/api/upload';

function toDateTime(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Calcula la fecha estimada de llegada/entrega: un mes después del encargo.
 */
function addOneMonth(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export function toEncargoPayload(
  values,
  imageId,
  existingDeliveredAt,
  shoppingDocumentId,
) {
  return {
    shoppingId: Math.trunc(Number(values.shoppingId)),
    ...(shoppingDocumentId ? { shopping: shoppingDocumentId } : {}),
    ownerName: values.ownerName.trim(),
    ownerPhoneNumber: values.ownerPhoneNumber.trim(),
    shopName: values.shopName.trim(),
    productLink: values.productLink.trim(),
    productDescription: values.productDescription.trim(),
    deliveredStatus: values.deliveredStatus,
    payStatus: values.payStatus,
    productPrice: Math.round(Number(values.productPrice)),
    shopPrice: Number(values.shopPrice),
    productWeight: Number(values.productWeight),
    poundPrice: Number(values.poundPrice),
    sentBy: values.sentBy,
    observation: values.observation?.trim() || null,
    encargoCreatedAt: toDateTime(values.encargoCreatedAt),
    lastPaid: toDateTime(values.lastPaid),
    arrivedAt: addOneMonth(values.encargoCreatedAt),
    deliveredAt: existingDeliveredAt || addOneMonth(values.encargoCreatedAt),
    ...(imageId ? { productImage: imageId } : {}),
  };
}

export async function fetchEncargos({
  page = 1,
  pageSize = 10,
  search = '',
  deliveredStatus = '',
  payStatus = '',
} = {}) {
  const params = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    sort: 'encargoCreatedAt:desc',
    'populate[0]': 'productImage',
    'populate[1]': 'shopping',
  };

  const term = search.trim();
  if (term) {
    params['filters[$or][0][ownerName][$containsi]'] = term;
    params['filters[$or][1][productDescription][$containsi]'] = term;
    params['filters[$or][2][shopName][$containsi]'] = term;
    params['filters[$or][3][ownerPhoneNumber][$containsi]'] = term;
  }

  if (deliveredStatus) {
    params['filters[deliveredStatus][$eq]'] = deliveredStatus;
  }

  if (payStatus) {
    params['filters[payStatus][$eq]'] = payStatus;
  }

  const { data } = await strapiClient.get('/api/encargos', { params });

  return {
    items: data.data ?? [],
    meta: data.meta?.pagination ?? { page, pageSize, pageCount: 1, total: 0 },
  };
}

export async function saveEncargo({
  documentId,
  values,
  imageFile,
  existingDeliveredAt,
  shoppingDocumentId,
}) {
  const imageId = imageFile ? (await uploadFile(imageFile)).id : null;
  const payload = toEncargoPayload(
    values,
    imageId,
    existingDeliveredAt,
    shoppingDocumentId,
  );

  if (documentId) {
    const { data } = await strapiClient.put(
      `/api/encargos/${documentId}`,
      { data: payload },
      { params: { status: 'published' } },
    );
    return data.data;
  }

  const { data } = await strapiClient.post(
    '/api/encargos',
    { data: payload },
    { params: { status: 'published' } },
  );

  return data.data;
}

export async function deleteEncargo(documentId) {
  const { data } = await strapiClient.delete(`/api/encargos/${documentId}`);
  return data?.data ?? null;
}

export async function markEncargoDelivered(documentId) {
  const { data } = await strapiClient.put(
    `/api/encargos/${documentId}`,
    {
      data: {
        deliveredStatus: 'Entregado',
        deliveredAt: new Date().toISOString(),
      },
    },
    { params: { status: 'published' } },
  );

  return data.data;
}
