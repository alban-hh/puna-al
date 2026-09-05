import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  accountApi,
  authApi,
  tokenStore,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from '@/api';
import { queryKeys } from '@/api/queryKeys';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [sessionActive, setSessionActive] = useState<boolean>(() => tokenStore.hasRefreshToken());

  const meQuery = useQuery({
    queryKey: queryKeys.me.profile,
    queryFn: () => accountApi.me(),
    enabled: sessionActive,
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const { refetch: refetchMe } = meQuery;
  const refetchUser = useCallback(() => {
    void refetchMe();
  }, [refetchMe]);

  useEffect(() => {
    return tokenStore.onSessionCleared(() => {
      setSessionActive(false);
      queryClient.clear();
    });
  }, [queryClient]);

  useEffect(() => {
    return tokenStore.onForbidden(() => {
      if (tokenStore.getAccessToken()) refetchUser();
    });
  }, [refetchUser]);

  useEffect(() => {
    if (
      meQuery.isError &&
      meQuery.error instanceof ApiError &&
      (meQuery.error.status === 401 || meQuery.error.status === 403)
    ) {
      tokenStore.forceSignOut();
    }
  }, [meQuery.isError, meQuery.error]);

  const applyAuthResponse = useCallback(
    (auth: AuthResponse) => {
      tokenStore.setTokens(auth.tokens);
      queryClient.setQueryData(queryKeys.me.profile, auth.user);
      setSessionActive(true);
    },
    [queryClient],
  );

  const login = useCallback(
    async (body: LoginRequest) => {
      const auth = await authApi.login(body);
      applyAuthResponse(auth);
      return auth.user;
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      const auth = await authApi.register(body);
      applyAuthResponse(auth);
      return auth.user;
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    tokenStore.clear();
    setSessionActive(false);
    queryClient.clear();
  }, [queryClient]);

  const user = meQuery.data ?? null;

  const status: AuthStatus = useMemo(() => {
    if (!sessionActive) return 'unauthenticated';
    if (user) return 'authenticated';
    if (meQuery.isError) return 'unauthenticated';
    return 'loading';
  }, [sessionActive, user, meQuery.isError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      isVerified: Boolean(user?.email_verified),
      login,
      register,
      logout,
      applyAuthResponse,
      refetchUser,
    }),
    [user, status, login, register, logout, applyAuthResponse, refetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
