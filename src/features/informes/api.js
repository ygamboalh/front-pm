import { strapiClient } from '@/shared/api/strapiClient';
import { normalizeConfiguration } from '@/features/configuracion/api';

const ACTIVE_STATUSES = ['Recibido', 'Disponible'];

function buildFields(fields) {
  return Object.fromEntries(fields.map((field, index) => [`fields[${index}]`, field]));
}

async function fetchAllCollection(path, fields) {
  const pageSize = 100;
  let page = 1;
  let pageCount = 1;
  const items = [];

  do {
    const { data } = await strapiClient.get(path, {
      params: {
        ...buildFields(fields),
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        sort: 'id:asc',
      },
    });

    items.push(...(data.data ?? []));
    pageCount = data.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return items;
}

function sumField(items, field) {
  return items.reduce((total, item) => total + (Number(item?.[field]) || 0), 0);
}

function categoryOf(product) {
  return product.category?.trim() || 'Sin categoría';
}

function isInStock(product) {
  const vendor = (product.takenByVendor || '').trim();
  return !vendor || vendor === 'En stock' || vendor === 'No asignado';
}

function soldCategoryRows(products, categories) {
  const map = new Map();

  for (const category of categories) {
    map.set(category, { category, count: 0, cost: 0, amount: 0, gain: 0 });
  }

  for (const product of products) {
    const key = categoryOf(product);
    const row =
      map.get(key) ?? { category: key, count: 0, cost: 0, amount: 0, gain: 0 };

    row.count += 1;
    row.cost += Number(product.totalCost) || 0;
    row.amount += Number(product.soldPrice) || 0;
    row.gain += Number(product.gainReal) || 0;
    map.set(key, row);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      percent: row.cost > 0 ? (row.gain / row.cost) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function inventoryCategoryRows(products, totalInvestment, categories) {
  const map = new Map();

  for (const category of categories) {
    map.set(category, {
      category,
      count: 0,
      investment: 0,
      gain: 0,
    });
  }

  for (const product of products) {
    const key = categoryOf(product);
    const row = map.get(key) ?? {
      category: key,
      count: 0,
      investment: 0,
      gain: 0,
    };

    row.count += 1;
    row.investment += Number(product.totalCost) || 0;
    row.gain += Number(product.gainPlanned) || 0;
    map.set(key, row);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      percent: row.investment > 0 ? (row.gain / row.investment) * 100 : 0,
      share: totalInvestment > 0 ? (row.investment / totalInvestment) * 100 : 0,
    }))
    .sort((a, b) => b.investment - a.investment);
}

export function buildReportData({
  configuration,
  products,
  shoppings,
  encargos,
  types = [],
}) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const typeCategories = [...types]
    .sort((a, b) => (Number(a.typeId) || 0) - (Number(b.typeId) || 0))
    .map((type) => type.description?.trim())
    .filter(Boolean);
  const productCategories = [...new Set(products.map(categoryOf))];
  const reportCategories = [
    ...typeCategories,
    ...productCategories.filter((category) => !typeCategories.includes(category)),
  ];

  const soldProducts = products.filter(
    (product) => product.deliveredStatus === 'Vendido',
  );
  const soldThisMonth = soldProducts.filter((product) => {
    if (!product.soldDate) return false;
    const date = new Date(product.soldDate);
    return `${date.getFullYear()}-${date.getMonth()}` === monthKey;
  });

  const purchasedProducts = products.filter(
    (product) => product.deliveredStatus === 'Comprado',
  );
  const activeProducts = products.filter((product) =>
    ACTIVE_STATUSES.includes(product.deliveredStatus),
  );
  const stockProducts = activeProducts.filter(isInStock);
  const vendorProducts = activeProducts.filter((product) => !isInStock(product));

  const closedShoppings = shoppings.filter((shopping) => shopping.isClosed);
  const pendingEncargos = encargos.filter(
    (encargo) => encargo.deliveredStatus !== 'Entregado',
  );
  const deliveredEncargos = encargos.filter(
    (encargo) => encargo.deliveredStatus === 'Entregado',
  );

  const stockInvestment = sumField(stockProducts, 'totalCost');
  const purchaseInvestment = sumField(purchasedProducts, 'totalCost');
  const soldCost = sumField(soldProducts, 'totalCost');
  const soldAmount = sumField(soldProducts, 'soldPrice');
  const realGain = sumField(soldProducts, 'gainReal');
  const virtualGain =
    sumField([...purchasedProducts, ...stockProducts], 'sellPrice') -
    (purchaseInvestment + stockInvestment);

  const soldRows = soldCategoryRows(soldThisMonth, reportCategories);
  const soldTotals = soldRows.reduce(
    (totals, row) => ({
      count: totals.count + row.count,
      cost: totals.cost + row.cost,
      amount: totals.amount + row.amount,
      gain: totals.gain + row.gain,
    }),
    { count: 0, cost: 0, amount: 0, gain: 0 },
  );

  const inventoryRows = inventoryCategoryRows(
    purchasedProducts,
    purchaseInvestment,
    reportCategories,
  );
  const inventoryTotals = inventoryRows.reduce(
    (totals, row) => ({
      count: totals.count + row.count,
      investment: totals.investment + row.investment,
      gain: totals.gain + row.gain,
    }),
    { count: 0, investment: 0, gain: 0 },
  );

  const totalBuySpent = sumField(closedShoppings, 'buySpent');
  const totalShippingSpent = sumField(closedShoppings, 'shippingSpent');
  const totalWeight = sumField(closedShoppings, 'totalWeight');
  const totalSpent = sumField(closedShoppings, 'totalSpent');

  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    general: {
      usdPrice: configuration?.usdPrice ?? 0,
      poundPrice: configuration?.poundPrice ?? 0,
      shoppingCount: shoppings.length,
      closedShoppingCount: closedShoppings.length,
      totalBuySpent,
      totalShippingSpent,
      totalWeight,
      totalSpent,
      totalEncargos: encargos.length,
      pendingEncargos: pendingEncargos.length,
      deliveredEncargos: deliveredEncargos.length,
      realGain,
    },
    business: {
      stockCount: stockProducts.length,
      stockInvestment,
      vendorCount: vendorProducts.length,
      purchasedCount: purchasedProducts.length,
      purchaseInvestment,
      soldCount: soldProducts.length,
      soldCost,
      soldAmount,
      realGain,
      virtualGain,
      purchasePounds: sumField(purchasedProducts, 'weight'),
      encargoPounds: sumField(pendingEncargos, 'productWeight'),
    },
    sold: {
      rows: soldRows,
      totals: {
        ...soldTotals,
        percent: soldTotals.cost > 0 ? (soldTotals.gain / soldTotals.cost) * 100 : 0,
      },
    },
    inventory: {
      rows: inventoryRows,
      totals: {
        ...inventoryTotals,
        percent:
          inventoryTotals.investment > 0
            ? (inventoryTotals.gain / inventoryTotals.investment) * 100
            : 0,
      },
    },
  };
}

export async function fetchReportData() {
  const [configurations, products, shoppings, encargos, types] = await Promise.all([
    strapiClient.get('/api/configurations', {
      params: { 'pagination[pageSize]': 1, sort: 'configCreatedAt:desc' },
    }),
    fetchAllCollection('/api/products', [
      'category',
      'deliveredStatus',
      'totalCost',
      'gainPlanned',
      'gainReal',
      'sellPrice',
      'soldPrice',
      'soldDate',
      'weight',
      'takenByVendor',
    ]),
    fetchAllCollection('/api/shoppings', [
      'isClosed',
      'buySpent',
      'shippingSpent',
      'totalWeight',
      'totalSpent',
      'totalEncargos',
      'shoppingCreatedAt',
    ]),
    fetchAllCollection('/api/encargos', ['productWeight', 'deliveredStatus']),
    fetchAllCollection('/api/typess', ['typeId', 'description']),
  ]);

  return buildReportData({
    configuration: normalizeConfiguration(configurations.data.data?.[0] ?? null),
    products,
    shoppings,
    encargos,
    types,
  });
}
