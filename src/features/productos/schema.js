import { z } from 'zod';
import { SENT_BY_OPTIONS, SHOP_OPTIONS } from '@/shared/lib/constants';
import { GAIN_PERCENT_OPTIONS } from './constants';

const money = (message = 'Introduce un número válido') =>
  z.number({ invalid_type_error: message }).min(0, 'No puede ser negativo');

const integer = (message = 'Introduce un número válido') =>
  z
    .number({ invalid_type_error: message })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo');

export const productSchema = z
  .object({
    category: z.string().trim().min(1, 'Selecciona una categoría'),
    shopSelect: z.enum(SHOP_OPTIONS),
    customShopName: z.string().optional(),
    productDescription: z.string().trim().min(2, 'Describe el producto'),
    sentBy: z.enum(SENT_BY_OPTIONS),
    productCreatedAt: z.string().min(1, 'Indica la fecha de alta'),
    buyDate: z.string().min(1, 'Indica la fecha de compra'),
    usdPrice: integer(),
    poundPrice: money(),
    shopPrice: money(),
    sellPrice: integer(),
    gainPercent: z
      .number({ invalid_type_error: 'Selecciona un porcentaje' })
      .int()
      .refine((value) => GAIN_PERCENT_OPTIONS.includes(value), {
        message: 'Selecciona un porcentaje válido',
      }),
    received: z.boolean().optional(),
    arrivedAt: z.string().optional(),
    weight: money(),
  })
  .superRefine((values, ctx) => {
    if (values.shopSelect === 'Otra' && !values.customShopName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customShopName'],
        message: 'Escribe el nombre de la tienda',
      });
    }

    if (values.received && !values.arrivedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['arrivedAt'],
        message: 'Indica la fecha de llegada',
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

export function resolveProductShop(values) {
  return values.shopSelect === 'Otra'
    ? values.customShopName.trim()
    : values.shopSelect;
}

export function computeProductCosts(values, usdOverride) {
  const usdPrice =
    Number(usdOverride === undefined ? values.usdPrice : usdOverride) || 0;
  const poundPrice = Number(values.poundPrice) || 0;
  const shopPrice = Number(values.shopPrice) || 0;
  const weight = Number(values.weight) || 0;
  const sellPrice = Number(values.sellPrice) || 0;

  const totalCost = Math.round(
    shopPrice * usdPrice * 1.12 + weight * poundPrice * usdPrice,
  );
  const gainPlanned = Math.round(sellPrice - totalCost);
  const gainPercent = totalCost > 0 ? (gainPlanned / totalCost) * 100 : 0;

  return { totalCost, gainPlanned, gainPercent };
}

export function computeSuggestedPrice(product, usdPrice) {
  const { totalCost } = computeProductCosts(product, usdPrice);
  const percent = Number(product?.gainPercent) || 0;

  return totalCost > 0 ? Math.round(totalCost * (1 + percent / 100)) : 0;
}

export function getProductDefaults(product, configuration) {
  if (product) {
    return {
      category: product.category?.trim() || 'Otros',
      ...resolveShop(product.shopName),
      productDescription: product.productDescription ?? '',
      sentBy: SENT_BY_OPTIONS.includes(product.sentBy) ? product.sentBy : 'Avion',
      productCreatedAt: toDateInput(product.productCreatedAt),
      buyDate: toDateInput(product.buyDate),
      usdPrice: Number(product.usdPrice) || 0,
      poundPrice: Number(product.poundPrice) || 0,
      shopPrice: Number(product.shopPrice) || 0,
      sellPrice: Number(product.sellPrice) || 0,
      gainPercent: GAIN_PERCENT_OPTIONS.includes(Number(product.gainPercent))
        ? Number(product.gainPercent)
        : 30,
      received: false,
      arrivedAt:
        toDateInput(product.arrivedAt) ||
        (product.deliveredStatus === 'Recibido' ? toDateInput(new Date()) : ''),
      weight: Number(product.weight) || 0,
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  return {
    category: '',
    shopSelect: SHOP_OPTIONS[0],
    customShopName: '',
    productDescription: '',
    sentBy: 'Avion',
    productCreatedAt: today,
    buyDate: today,
    usdPrice: configuration?.usdPrice ?? 0,
    poundPrice: configuration?.poundPrice ?? 0,
    shopPrice: 0,
    sellPrice: 0,
    gainPercent: 30,
    received: false,
    arrivedAt: '',
    weight: 0,
  };
}
