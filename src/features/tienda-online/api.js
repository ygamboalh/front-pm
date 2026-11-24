import { API_URL } from '@/shared/api/strapiClient';
import { formatNumber } from '@/shared/lib/formatters';

export function resolveStoreImage(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function normalizeWhatsAppNumber(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function buildWhatsAppLink(number, product) {
  const digits = normalizeWhatsAppNumber(number);
  if (!digits) return null;

  const message = `Hola, me interesa "${product.description}" (${formatNumber(product.price)}cup). ¿Sigue disponible?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function fetchStorefront() {
  const response = await fetch(`${API_URL}/api/storefront`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la tienda (${response.status})`);
  }

  const data = await response.json();

  return {
    whatsappNumber: data?.whatsappNumber ?? '',
    categories: Array.isArray(data?.categories) ? data.categories : [],
    available: Array.isArray(data?.available) ? data.available : [],
    coming: Array.isArray(data?.coming) ? data.coming : [],
  };
}
