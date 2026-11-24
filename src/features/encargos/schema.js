import { z } from 'zod';
import { PAY_STATUS_OPTIONS, SENT_BY_OPTIONS, SHOP_OPTIONS } from './constants';

const requiredString = (message) => z.string().trim().min(1, message);

export const encargoSchema = z
  .object({
    ownerName: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    ownerPhoneNumber: z.string().trim().min(5, 'Teléfono demasiado corto'),
    shopSelect: z.enum(SHOP_OPTIONS),
    customShopName: z.string().optional(),
    productLink: requiredString('Pega el enlace del producto'),
    productDescription: z.string().trim().min(2, 'Describe el producto'),
    payStatus: z.enum(PAY_STATUS_OPTIONS),
    productPrice: z
      .number({ invalid_type_error: 'Introduce un número válido' })
      .min(0, 'No puede ser negativo'),
    shopPrice: z
      .number({ invalid_type_error: 'Introduce un número válido' })
      .min(0, 'No puede ser negativo'),
    productWeight: z
      .number({ invalid_type_error: 'Introduce un número válido' })
      .min(0, 'No puede ser negativo'),
    poundPrice: z
      .number({ invalid_type_error: 'Introduce un número válido' })
      .min(0, 'No puede ser negativo'),
    sentBy: z.enum(SENT_BY_OPTIONS),
    observation: z.string().optional(),
    encargoCreatedAt: requiredString('Indica la fecha del encargo'),
    lastPaid: requiredString('Indica la fecha del último pago'),
  })
  .superRefine((values, ctx) => {
    if (values.shopSelect === 'Otra' && !values.customShopName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customShopName'],
        message: 'Escribe el nombre de la tienda',
      });
    }
  });

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function resolveShop(shopName) {
  const name = shopName?.trim() ?? '';
  if (SHOP_OPTIONS.includes(name) && name !== 'Otra') {
    return { shopSelect: name, customShopName: '' };
  }
  return { shopSelect: 'Otra', customShopName: name };
}

export function getEncargoDefaults(encargo) {
  if (encargo) {
    return {
      ownerName: encargo.ownerName ?? '',
      ownerPhoneNumber: encargo.ownerPhoneNumber ?? '',
      ...resolveShop(encargo.shopName),
      productLink: encargo.productLink ?? '',
      productDescription: encargo.productDescription ?? '',
      payStatus: PAY_STATUS_OPTIONS.includes(encargo.payStatus)
        ? encargo.payStatus
        : 'No pagado',
      productPrice: Number(encargo.productPrice) || 0,
      shopPrice: Number(encargo.shopPrice) || 0,
      productWeight: Number(encargo.productWeight) || 0,
      poundPrice: Number(encargo.poundPrice) || 0,
      sentBy: SENT_BY_OPTIONS.includes(encargo.sentBy) ? encargo.sentBy : 'Avion',
      observation: encargo.observation ?? '',
      encargoCreatedAt: toDateInput(encargo.encargoCreatedAt),
      lastPaid: toDateInput(encargo.lastPaid),
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  return {
    ownerName: '',
    ownerPhoneNumber: '',
    shopSelect: SHOP_OPTIONS[0],
    customShopName: '',
    productLink: '',
    productDescription: '',
    payStatus: 'No pagado',
    productPrice: 0,
    shopPrice: 0,
    productWeight: 0,
    poundPrice: 0,
    sentBy: 'Avion',
    observation: '',
    encargoCreatedAt: today,
    lastPaid: today,
  };
}
