import { strapiClient } from '@/shared/api/strapiClient';

export async function loginRequest({ identifier, password }) {
  const { data } = await strapiClient.post('/api/auth/local', { identifier, password });

  return {
    token: data.jwt,
    user: data.user,
  };
}

export async function fetchCurrentUser() {
  const { data } = await strapiClient.get('/api/users/me');
  return data;
}

export async function logoutRequest() {
  await strapiClient.post('/api/auth/logout');
}
