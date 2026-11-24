import { API_URL } from './strapiClient';

/**
 * Strapi devuelve las medias con URLs relativas. Este helper las convierte
 * en URLs absolutas y soporta tanto una media única como un array.
 */
export function resolveMediaUrl(media) {
  const item = Array.isArray(media) ? media[0] : media;
  const url = item?.url;

  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function resolveMediaList(media) {
  const list = Array.isArray(media) ? media : media ? [media] : [];

  return list.map((item) => ({
    id: item.id,
    name: item.name,
    width: item.width,
    height: item.height,
    url: resolveMediaUrl(item),
  }));
}

/**
 * Devuelve la URL de una variante concreta (thumbnail, small, medium, large)
 * y cae al original si Strapi no generó esa variante.
 */
export function resolveMediaThumbnail(media, size = 'medium') {
  const item = Array.isArray(media) ? media[0] : media;
  const url = item?.formats?.[size]?.url || item?.url;

  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
