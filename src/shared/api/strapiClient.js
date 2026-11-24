import axios from 'axios';
import { useAuthStore } from '@/features/auth/store/authStore';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(
  /\/+$/,
  '',
);

export const strapiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
});

// Cliente separado para el refresh: no pasa por los interceptores y así se
// evita cualquier bucle de reintentos.
const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
});

let refreshPromise = null;

function isAuthEndpoint(url = '') {
  return url.includes('/api/auth/local') || url.includes('/api/auth/refresh');
}

/**
 * Strapi (jwtManagement: 'refresh') emite access tokens de corta duración y
 * guarda el refresh token en una cookie httpOnly. Aquí se renueva el access
 * token compartiendo una única petición entre todos los 401 concurrentes.
 */
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/api/auth/refresh')
      .then(({ data }) => {
        const token = data?.jwt;
        if (!token) throw new Error('No se pudo renovar la sesión');
        useAuthStore.getState().setToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

strapiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

strapiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const original = error.config;
    const url = original?.url ?? '';

    if (status === 401 && original && !original._retry && !isAuthEndpoint(url)) {
      original._retry = true;

      return refreshAccessToken()
        .then((token) => {
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${token}`,
          };
          return strapiClient(original);
        })
        .catch(() => {
          useAuthStore.getState().clearSession();
          return Promise.reject(error);
        });
    }

    if (status === 401 && !isAuthEndpoint(url)) {
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  },
);

/**
 * Extrae un mensaje legible de los distintos formatos de error de Strapi.
 */
export function getApiErrorMessage(error, fallback = 'Ha ocurrido un error inesperado') {
  const data = error?.response?.data;
  const message = data?.error?.message || data?.message || error?.message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  const details = data?.error?.details?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((item) => item.message || item.path).join('. ');
  }

  return fallback;
}
