export {
  SENT_BY_LABELS,
  SENT_BY_OPTIONS,
  SHOP_OPTIONS,
} from '@/shared/lib/constants';

export const DELIVERED_STATUS_OPTIONS = ['Pendiente', 'Comprado', 'Recibido', 'Entregado'];

export const PAY_STATUS_OPTIONS = ['Pagado', 'No pagado'];

export function toSelectOptions(values) {
  return values.map((value) => ({ value, label: value }));
}
