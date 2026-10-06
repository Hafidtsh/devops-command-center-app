'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, AuthTokens, User } from '@/types';
import { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterPayload { email: string; password: string; fullName: string; }
interface LoginPayload { email: string; password: string; totpCode?: string; }
interface LoginResponse { mfaRequired?: boolean; userId?: string; }

// ─── Helper to extract error message ─────────────────────────────────────────

export function getApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}

// ─── Auth Hooks ───────────────────────────────────────────────────────────────

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<ApiResponse<AuthTokens>>('/auth/register', payload),
    onSuccess: ({ data }) => {
      const { accessToken, refreshToken, user } = data.data;
      setAuth({ user: user as User, accessToken, refreshToken });
      router.push('/dashboard');
    },
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<ApiResponse<AuthTokens & LoginResponse>>('/auth/login', payload),
    onSuccess: ({ data }) => {
      const result = data.data;
      if (result.mfaRequired) {
        // Caller handles MFA redirect
        return;
      }
      const { accessToken, refreshToken, user } = result as AuthTokens;
      setAuth({ user: user as User, accessToken, refreshToken });
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const { refreshToken, logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.post('/auth/logout', { refreshToken }),
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });
}

export function useMe() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
    enabled: isAuthenticated,
  });
}

export function useSetupMfa() {
  return useMutation({
    mutationFn: () =>
      api.post<ApiResponse<{ secret: string; qrCodeUrl: string; otpauthUrl: string }>>('/auth/mfa/setup'),
  });
}

export function useVerifyMfa() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (totpCode: string) =>
      api.post<ApiResponse<null>>('/auth/mfa/verify', { totpCode }),
    onSuccess: async () => {
      const { data } = await api.get<ApiResponse<User>>('/auth/me');
      setUser(data.data);
    },
  });
}

export function useDisableMfa() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (password: string) =>
      api.post<ApiResponse<null>>('/auth/mfa/disable', { password }),
    onSuccess: async () => {
      const { data } = await api.get<ApiResponse<User>>('/auth/me');
      setUser(data.data);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.post<ApiResponse<null>>('/auth/change-password', payload),
  });
}
