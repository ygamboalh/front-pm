import { z } from 'zod';

export const taxSchema = z.object({
  description: z.string().optional(),
  month: z.string().trim().min(1, 'Indica el mes'),
  code: z.string().trim().min(1, 'Indica la referencia o código'),
  amount: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo'),
  realPaid: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .min(0, 'No puede ser negativo'),
  gain: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo'),
  taxCreatedAt: z.string().min(1, 'Indica la fecha de registro'),
  paymentDate: z.string().min(1, 'Indica la fecha de pago'),
});

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function getTaxDefaults(tax) {
  if (tax) {
    return {
      description: tax.description ?? '',
      month: tax.month ?? '',
      code: tax.code ?? '',
      amount: Number(tax.amount) || 0,
      realPaid: Number(tax.realPaid) || 0,
      gain: Number(tax.gain) || 0,
      taxCreatedAt: toDateInput(tax.taxCreatedAt),
      paymentDate: toDateInput(tax.paymentDate),
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const month = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return {
    description: '',
    month: month.charAt(0).toUpperCase() + month.slice(1),
    code: '',
    amount: 0,
    realPaid: 0,
    gain: 0,
    taxCreatedAt: today,
    paymentDate: today,
  };
}
