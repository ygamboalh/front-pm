import { strapiClient } from '@/shared/api/strapiClient';
import { uploadFiles } from '@/shared/api/upload';
import { computeProductCosts, resolveProductShop } from './schema';

function toDateTime(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toProductPayload(values, imageIds, current) {
  const { totalCost, gainPlanned } = computeProductCosts(values);
  const isSold = current?.deliveredStatus === 'Vendido';
  const isReceived = values.received || current?.deliveredStatus === 'Recibido';
  const arrivalDate = values.arrivedAt || new Date().toISOString().slice(0, 10);

  return {
    productCreatedAt: toDateTime(values.productCreatedAt),
    usdPrice: Math.round(Number(values.usdPrice) || 0),
    poundPrice: Number(values.poundPrice) || 0,
    shopPrice: Number(values.shopPrice) || 0,
    sellPrice: Math.round(Number(values.sellPrice) || 0),
    soldPrice: Math.round(Number(current?.soldPrice) || 0),
    totalCost,
    weight: Number(values.weight) || 0,
    soldDate:
      isSold && current?.soldDate ? current.soldDate : toDateTime(values.buyDate),
    category: values.category.trim(),
    buyDate: toDateTime(values.buyDate),
    gainPlanned,
    gainReal: Math.round(Number(current?.gainReal) || 0),
    gainPercent: Math.round(Number(values.gainPercent) || 30),
    productImage: imageIds,
    deliveredStatus: values.received
      ? 'Recibido'
      : current?.deliveredStatus || 'Comprado',
    arrivedAt: isReceived ? toDateTime(arrivalDate) : current?.arrivedAt ?? null,
    productDescription: values.productDescription.trim(),
    shopName: resolveProductShop(values),
    sentBy: values.sentBy,
    takenByVendor: current?.takenByVendor?.trim() || 'En stock',
    dateTakenByVendor: current?.dateTakenByVendor ?? null,
  };
}

export async function fetchProductTypes() {
  const { data } = await strapiClient.get('/api/typess', {
    params: {
      'pagination[pageSize]': 100,
      sort: 'typeId:asc',
      status: 'published',
    },
  });

  return (data.data ?? [])
    .map((type) => type.description?.trim())
    .filter(Boolean);
}

export async function fetchProducts({
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  category = '',
  stock = '',
  soldDate = '',
  sort = 'productCreatedAt:desc',
} = {}) {
  const params = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    sort,
    populate: 'productImage',
  };

  const term = search.trim();
  if (term) {
    params['filters[$or][0][productDescription][$containsi]'] = term;
    params['filters[$or][1][category][$containsi]'] = term;
    params['filters[$or][2][shopName][$containsi]'] = term;
    params['filters[$or][3][takenByVendor][$containsi]'] = term;
  }

  if (status) {
    params['filters[deliveredStatus][$eq]'] = status;
  }

  if (category) {
    params['filters[category][$eq]'] = category;
  }

  if (stock === 'stock') {
    params['filters[takenByVendor][$eq]'] = 'En stock';
  } else if (stock === 'vendor') {
    params['filters[takenByVendor][$ne]'] = 'En stock';
  }

  if (soldDate) {
    const start = new Date(`${soldDate}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      params['filters[soldDate][$gte]'] = start.toISOString();
      params['filters[soldDate][$lt]'] = end.toISOString();
    }
  }

  const { data } = await strapiClient.get('/api/products', { params });

  return {
    items: data.data ?? [],
    meta: data.meta?.pagination ?? { page, pageSize, pageCount: 1, total: 0 },
  };
}

async function countProducts(filters = {}) {
  const { data } = await strapiClient.get('/api/products', {
    params: { ...filters, 'pagination[pageSize]': 1 },
  });

  return data.meta?.pagination?.total ?? 0;
}

export async function fetchProductStats(status) {
  const base = status ? { 'filters[deliveredStatus][$eq]': status } : {};

  const [total, inStock, withVendor] = await Promise.all([
    countProducts(base),
    countProducts({ ...base, 'filters[takenByVendor][$eq]': 'En stock' }),
    countProducts({ ...base, 'filters[takenByVendor][$ne]': 'En stock' }),
  ]);

  return { total, inStock, withVendor };
}

async function sumSoldProducts({ from, to }) {
  const pageSize = 100;
  let page = 1;
  let pageCount = 1;
  let count = 0;
  let amount = 0;
  let gain = 0;

  do {
    const { data } = await strapiClient.get('/api/products', {
      params: {
        'filters[deliveredStatus][$eq]': 'Vendido',
        'filters[soldDate][$gte]': from.toISOString(),
        'filters[soldDate][$lt]': to.toISOString(),
        'fields[0]': 'soldPrice',
        'fields[1]': 'gainReal',
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
      },
    });

    for (const product of data.data ?? []) {
      count += 1;
      amount += Number(product.soldPrice) || 0;
      gain += Number(product.gainReal) || 0;
    }

    pageCount = data.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return { count, amount, gain };
}

export async function fetchSalesSummary() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [today, month] = await Promise.all([
    sumSoldProducts({ from: startOfDay, to: startOfTomorrow }),
    sumSoldProducts({ from: startOfMonth, to: startOfNextMonth }),
  ]);

  return { today, month };
}

export async function assignProductToVendor({ documentId, values, current }) {
  const sellPrice = Math.round(Number(values.sellPrice) || 0);
  const totalCost = Math.round(Number(current?.totalCost) || 0);

  const { data } = await strapiClient.put(
    `/api/products/${documentId}`,
    {
      data: {
        sellPrice,
        takenByVendor: values.takenByVendor.trim(),
        dateTakenByVendor: toDateTime(values.dateTakenByVendor),
        gainPlanned: sellPrice - totalCost,
      },
    },
    { params: { status: 'published' } },
  );

  return data.data;
}

export async function saveProduct({
  documentId,
  values,
  files = [],
  keepImageIds = [],
  current = null,
}) {
  const uploaded = files.length > 0 ? await uploadFiles(files) : [];
  const imageIds = [
    ...keepImageIds.map((id) => Number(id)),
    ...uploaded.map((media) => media.id),
  ];

  if (imageIds.length === 0) {
    throw new Error('El producto necesita al menos una imagen');
  }

  const payload = toProductPayload(values, imageIds, current);

  if (documentId) {
    const { data } = await strapiClient.put(
      `/api/products/${documentId}`,
      { data: payload },
      { params: { status: 'published' } },
    );
    return data.data;
  }

  const { data } = await strapiClient.post(
    '/api/products',
    { data: payload },
    { params: { status: 'published' } },
  );

  return data.data;
}

export async function markProductSold({ documentId, current, soldPrice, cost }) {
  const price = Math.round(
    Number(soldPrice === undefined ? current?.sellPrice : soldPrice) || 0,
  );
  const totalCost = Math.round(Number(cost ?? current?.totalCost) || 0);

  const { data } = await strapiClient.put(
    `/api/products/${documentId}`,
    {
      data: {
        deliveredStatus: 'Vendido',
        soldDate: new Date().toISOString(),
        soldPrice: price,
        gainReal: price - totalCost,
      },
    },
    { params: { status: 'published' } },
  );

  return data.data;
}

export async function registerSaleInCash({ product, soldPrice }) {
  const price = Math.round(Number(soldPrice) || 0);
  if (!product || price <= 0) return null;

  const { data } = await strapiClient.get('/api/cashes', {
    params: {
      sort: 'movementDate:desc',
      'pagination[pageSize]': 1,
    },
  });

  const previousBalance = Number(data.data?.[0]?.resto) || 0;

  const { data: created } = await strapiClient.post('/api/cashes', {
    data: {
      gasto: 0,
      ganancia: price,
      resto: previousBalance + price,
      motivoGasto: '',
      motivoGanancia: `Venta-${product.category || 'Producto'}-${product.productDescription || ''}`,
      movementDate: new Date().toISOString(),
    },
  });

  return created.data;
}

export async function returnProductToStore({ documentId, current }) {
  const { data } = await strapiClient.put(
    `/api/products/${documentId}`,
    {
      data: {
        deliveredStatus: 'Recibido',
        takenByVendor: 'En stock',
        dateTakenByVendor: null,
        soldPrice: 0,
        soldDate: current?.soldDate || new Date().toISOString(),
        gainReal: 0,
      },
    },
    { params: { status: 'published' } },
  );

  return data.data;
}

export async function deleteProduct(documentId) {
  const { data } = await strapiClient.delete(`/api/products/${documentId}`);
  return data?.data ?? null;
}
