export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  dashboard: {
    overview: ['dashboard', 'overview'],
  },
  configurations: {
    all: ['configurations'],
    current: ['configurations', 'current'],
    list: (params) => ['configurations', 'list', params],
  },
  encargos: {
    all: ['encargos'],
    list: (params) => ['encargos', 'list', params],
  },
  shoppings: {
    all: ['shoppings'],
    list: (params) => ['shoppings', 'list', params],
    open: ['shoppings', 'open'],
    encargos: (shoppingId) => ['shoppings', 'encargos', shoppingId],
    encargosAll: (shoppingId) => ['shoppings', 'encargos-all', shoppingId],
    encargoCounts: (ids) => ['shoppings', 'encargo-counts', ids],
    encargoCountsRoot: ['shoppings', 'encargo-counts'],
  },
  products: {
    all: ['products'],
    stats: (status) => ['products', 'stats', status || 'all'],
    salesSummary: ['products', 'sales-summary'],
    list: (params) => ['products', 'list', params],
  },
  reports: {
    all: ['reports'],
  },
  types: {
    all: ['types'],
  },
  storefront: {
    all: ['storefront'],
  },
  cash: {
    all: ['cash'],
  },
  taxes: {
    all: ['taxes'],
    list: (params) => ['taxes', 'list', params],
  },
};
