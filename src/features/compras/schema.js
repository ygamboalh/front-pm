import { z } from 'zod';
import { SENT_BY_OPTIONS } from '@/shared/lib/constants';

export const shoppingSchema = z.object({
  shoppingCreatedAt: z.string().min(1, 'Indica la fecha de la compra'),
  sentBy: z.enum(SENT_BY_OPTIONS),
});

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function getShoppingDefaults(shopping) {
  if (shopping) {
    return {
      shoppingCreatedAt: toDateInput(shopping.shoppingCreatedAt),
      sentBy: SENT_BY_OPTIONS.includes(shopping.sentBy) ? shopping.sentBy : 'Avion',
    };
  }

  return {
    shoppingCreatedAt: new Date().toISOString().slice(0, 10),
    sentBy: 'Avion',
  };
}
