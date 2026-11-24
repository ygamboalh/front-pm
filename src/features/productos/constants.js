export const PRODUCT_CATEGORY_OPTIONS = [
  'Zapatos de hombre',
  'Zapatos de mujer',
  'Zapatos de niño',
  'Ventilador recargable',
  'Reloj inteligente',
  'Máquinas de pelar',
  'Baterías',
  'Bocinas',
  'Audífonos',
  'Amplificadores',
  'Belleza',
  'Conjunto',
  'Otros',
];

export const GAIN_PERCENT_OPTIONS = [25, 30, 35, 45];

export const PRODUCT_STATUS_OPTIONS = [
  'Comprado',
  'Recibido',
  'Disponible',
  'Vendido',
  'No disponible',
];

export function toSelectOptions(values) {
  return values.map((value) => ({ value, label: value }));
}
