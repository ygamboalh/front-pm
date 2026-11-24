import { strapiClient } from './strapiClient';

/**
 * Sube uno o varios archivos al plugin de media de Strapi.
 * Devuelve el array de objetos de media creados.
 */
export async function uploadFiles(files) {
  const list = Array.from(files ?? []);
  if (list.length === 0) return [];

  const formData = new FormData();
  for (const file of list) {
    formData.append('files', file);
  }

  const { data } = await strapiClient.post('/api/upload', formData);

  return Array.isArray(data) ? data : [data];
}

export async function uploadFile(file) {
  const [media] = await uploadFiles([file]);

  if (!media?.id) {
    throw new Error('No se pudo subir la imagen a Strapi');
  }

  return media;
}
