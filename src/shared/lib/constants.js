export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Primera Mano';
export const APP_VERSION = '0.1.0 · Fase 8';

export const SENT_BY_OPTIONS = ['Avion', 'Barco'];

export const SENT_BY_LABELS = {
  Avion: 'Avión',
  Barco: 'Barco',
};

export const SHOP_OPTIONS = [
  'Temu',
  'Shein',
  'AliExpress',
  'Amazon',
  'eBay',
  'Walmart',
  'Otra',
];

export const PAY_STATUS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  parcial: 'Parcial',
};

export const DELIVERED_STATUS = {
  pendiente: 'Pendiente',
  recibido: 'Recibido',
  entregado: 'Entregado',
  vendido: 'Vendido',
};
