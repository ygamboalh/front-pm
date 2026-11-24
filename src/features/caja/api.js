import { strapiClient } from '@/shared/api/strapiClient';

const PAGE_SIZE = 100;

export function summarizeCash(movements) {
  const income = movements
    .filter((movement) => Number(movement.ganancia) > 0)
    .reduce((total, movement) => total + (Number(movement.ganancia) || 0), 0);

  const expenses = movements
    .filter((movement) => Number(movement.gasto) > 0)
    .reduce((total, movement) => total + (Number(movement.gasto) || 0), 0);

  return {
    balance: Number(movements[0]?.resto) || 0,
    income,
    expenses,
    count: movements.length,
  };
}

export async function fetchCashMovements() {
  return fetchAllCash('movementDate:desc');
}

async function fetchAllCash(sort) {
  let page = 1;
  let pageCount = 1;
  const items = [];

  do {
    const { data } = await strapiClient.get('/api/cashes', {
      params: {
        'pagination[page]': page,
        'pagination[pageSize]': PAGE_SIZE,
        sort,
      },
    });

    items.push(...(data.data ?? []));
    pageCount = data.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return items;
}

async function recalculateBalances() {
  const movements = await fetchAllCash('movementDate:asc');
  const first = movements[0];
  let balance = first
    ? (Number(first.resto) || 0) -
      ((Number(first.ganancia) || 0) - (Number(first.gasto) || 0))
    : 0;

  for (const movement of movements) {
    balance += (Number(movement.ganancia) || 0) - (Number(movement.gasto) || 0);

    if (Number(movement.resto) !== balance) {
      await strapiClient.put(`/api/cashes/${movement.documentId}`, {
        data: { resto: balance },
      });
    }
  }
}

export async function createCashMovement({ type, amount, motive, previousBalance = 0 }) {
  const value = Math.max(0, Math.round(Number(amount) || 0));
  const isIncome = type === 'ganancia';

  const { data } = await strapiClient.post('/api/cashes', {
    data: {
      gasto: isIncome ? 0 : value,
      ganancia: isIncome ? value : 0,
      resto: (Number(previousBalance) || 0) + (isIncome ? value : -value),
      motivoGanancia: isIncome ? motive : '',
      motivoGasto: isIncome ? '' : motive,
      movementDate: new Date().toISOString(),
    },
  });

  return data.data;
}

export async function deleteCashMovement(documentId) {
  const { data } = await strapiClient.delete(`/api/cashes/${documentId}`);
  await recalculateBalances();
  return data?.data ?? null;
}

export async function clearCashMovements(documentIds) {
  for (const documentId of documentIds) {
    if (!documentId) continue;
    await strapiClient.delete(`/api/cashes/${documentId}`);
  }

  return documentIds.length;
}
