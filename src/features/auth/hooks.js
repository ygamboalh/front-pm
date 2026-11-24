import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchCurrentUser, loginRequest } from './api';
import { useAuthStore } from './store/authStore';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => setSession(session),
  });
}

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await fetchCurrentUser();
      setUser(user);
      return user;
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}
