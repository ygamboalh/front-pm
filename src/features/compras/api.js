import { strapiClient } from '@/shared/api/strapiClient';

function toDateTime(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * En Strapi v5 el id numérico de una entrada publicada cambia al actualizarla.
 * Para la interfaz usamos un código estable derivado del documentId.
 */
export function getShoppingCode(shopping) {
  const documentId = shopping?.documentId;
  if (documentId) return `CMP-${documentId.slice(-6).toUpperCase()}`;
  return shopping?.id ? `CMP-${shopping.id}` : 'CMP';
}

export function toShoppingPayload(values) {
  return {
    shoppingCreatedAt: toDateTime(values.shoppingCreatedAt),
    sentBy: values.sentBy,
  };
}

export async function fetchShoppings({ page = 1, pageSize = 10, isClosed = '' } = {}) {
  const params = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    sort: 'shoppingCreatedAt:desc',
  };

  if (isClosed === 'true' || isClosed === 'false') {
    params['filters[isClosed][$eq]'] = isClosed === 'true';
  }

  const { data } = await strapiClient.get('/api/shoppings', { params });

  return {
    items: data.data ?? [],
    meta: data.meta?.pagination ?? { page, pageSize, pageCount: 1, total: 0 },
  };
}

export async function fetchOpenShopping() {
  const { data } = await strapiClient.get('/api/shoppings', {
    params: {
      'filters[isClosed][$eq]': false,
      'pagination[pageSize]': 1,
      sort: 'shoppingCreatedAt:desc',
    },
  });

  return data.data?.[0] ?? null;
}

export async function fetchShoppingEncargos(shoppingDocumentId) {
  const { data } = await strapiClient.get('/api/encargos', {
    params: {
      'filters[shopping][documentId][$eq]': shoppingDocumentId,
      'pagination[pageSize]': 20,
      sort: 'encargoCreatedAt:desc',
    },
  });

  return {
    items: data.data ?? [],
    total: data.meta?.pagination?.total ?? 0,
  };
}

/**
 * Trae todos los encargos de una compra (paginando) para calcular totales.
 */
export async function fetchAllShoppingEncargos(shoppingDocumentId) {
  const pageSize = 100;
  let page = 1;
  let pageCount = 1;
  const items = [];

  do {
    const { data } = await strapiClient.get('/api/encargos', {
      params: {
        'filters[shopping][documentId][$eq]': shoppingDocumentId,
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        sort: 'encargoCreatedAt:desc',
      },
    });

    items.push(...(data.data ?? []));
    pageCount = data.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return items;
}

/**
 * Cuenta los encargos de varias compras en una sola consulta paginada.
 */
export async function fetchShoppingEncargoCounts(shoppingIds) {
  const ids = [...new Set((shoppingIds ?? []).map(Number).filter(Boolean))];
  const counts = Object.fromEntries(ids.map((id) => [String(id), 0]));

  if (ids.length === 0) return counts;

  let page = 1;
  let pageCount = 1;

  do {
    const params = {
      'fields[0]': 'shoppingId',
      'pagination[page]': page,
      'pagination[pageSize]': 100,
      sort: 'id:asc',
    };

    ids.forEach((id, index) => {
      params[`filters[shoppingId][$in][${index}]`] = id;
    });

    const { data } = await strapiClient.get('/api/encargos', { params });

    for (const row of data.data ?? []) {
      const key = String(row.shoppingId);
      if (key in counts) counts[key] += 1;
    }

    pageCount = data.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return counts;
}

export async function createShopping(values, configuration) {
  const payload = {
    ...toShoppingPayload(values),
    usdPrice: Math.round(Number(configuration?.usdPrice) || 0),
    poundPrice: Number(configuration?.poundPrice) || 0,
    totalWeight: 0,
    shippingSpent: 0,
    buySpent: 0,
    gain: 0,
    totalSpent: 0,
    isClosed: false,
    givenMoney: 0,
    totalEncargos: 0,
    totalSpentUSD: 0,
  };

  const { data } = await strapiClient.post(
    '/api/shoppings',
    { data: payload },
    { params: { status: 'published' } },
  );

  return data.data;
}

/**
 * Strapi v5 genera un id publicado nuevo cada vez que se publica la compra.
 * Reasignamos los encargos al id nuevo para no perder la relación.
 */
export async function remapEncargosShoppingId(oldId, newId) {
  const from = Number(oldId);
  const to = Number(newId);

  if (!from || !to || from === to) return 0;

  let updated = 0;
  let guard = 0;

  while (guard < 100) {
    const { data } = await strapiClient.get('/api/encargos', {
      params: {
        'filters[shoppingId][$eq]': from,
        'fields[0]': 'shoppingId',
        'pagination[pageSize]': 100,
      },
    });

    const rows = data.data ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      await strapiClient.put(
        `/api/encargos/${row.documentId}`,
        { data: { shoppingId: to } },
        { params: { status: 'published' } },
      );
      updated += 1;
    }

    guard += 1;
  }

  return updated;
}

export async function updateShopping({ documentId, values, oldId }) {
  const { data } = await strapiClient.put(
    `/api/shoppings/${documentId}`,
    { data: toShoppingPayload(values) },
    { params: { status: 'published' } },
  );

  await remapEncargosShoppingId(oldId, data.data.id);
  return data.data;
}

export async function closeShopping({ documentId, data, oldId }) {
  const { data: response } = await strapiClient.put(
    `/api/shoppings/${documentId}`,
    { data: { ...data, isClosed: true } },
    { params: { status: 'published' } },
  );

  await remapEncargosShoppingId(oldId, response.data.id);
  return response.data;
}

export async function setShoppingClosed({ documentId, isClosed, oldId }) {
  const { data } = await strapiClient.put(
    `/api/shoppings/${documentId}`,
    { data: { isClosed } },
    { params: { status: 'published' } },
  );

  await remapEncargosShoppingId(oldId, data.data.id);
  return data.data;
}

export async function deleteShopping(documentId) {
  const { data } = await strapiClient.delete(`/api/shoppings/${documentId}`);
  return data?.data ?? null;
}
