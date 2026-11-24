const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toDate(value) {
  if (!value) return null;
  // Las fechas sin hora (YYYY-MM-DD) se interpretan como locales para evitar
  // que el desfase UTC muestre el día anterior.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  return new Date(value);
}

export function formatDate(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

const numberFormatter = new Intl.NumberFormat('es-ES');

export function formatNumber(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  return Number.isNaN(number) ? fallback : numberFormatter.format(number);
}

export function formatUsd(value, fallback = '—') {
  const formatted = formatNumber(value, fallback);
  if (formatted === fallback) return fallback;
  const number = Number(value);
  return number < 0
    ? `-$${formatNumber(Math.abs(number))}`
    : `$${formatted}`;
}

export function formatCup(value, fallback = '—') {
  const formatted = formatNumber(value, fallback);
  if (formatted === fallback) return fallback;
  const number = Number(value);
  return number < 0
    ? `-${formatNumber(Math.abs(number))}cup`
    : `${formatted}cup`;
}

export function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(number);
}

export function getInitials(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
