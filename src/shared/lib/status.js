const PAY_STATUS_VARIANTS = {
  pagado: 'success',
  parcial: 'warning',
  'no pagado': 'danger',
  pendiente: 'neutral',
};

const DELIVERED_STATUS_VARIANTS = {
  entregado: 'success',
  vendido: 'success',
  comprado: 'brand',
  recibido: 'brand',
  disponible: 'brand',
  pendiente: 'neutral',
  eliminado: 'danger',
  'no disponible': 'danger',
};

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function payStatusVariant(status) {
  return PAY_STATUS_VARIANTS[normalize(status)] || 'neutral';
}

export function deliveredStatusVariant(status) {
  return DELIVERED_STATUS_VARIANTS[normalize(status)] || 'neutral';
}
