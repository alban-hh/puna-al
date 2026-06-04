import { apiClient } from '../client';
import type {
  EmailOnlyRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../requests';
import type { AuthResponse, MessageResponse } from '../types';

const noAuth = { auth: false, skipAuthRefresh: true } as const;

export const authApi = {
  register: (body: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', body, noAuth),

  login: (body: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', body, noAuth),

  logout: (refresh_token: string) =>
    apiClient.post<void>('/auth/logout', { refresh_token }, noAuth),

  verifyEmail: (body: VerifyEmailRequest) =>
    apiClient.post<MessageResponse>('/auth/verify-email', body, noAuth),

  resendVerification: (body: EmailOnlyRequest) =>
    apiClient.post<MessageResponse>('/auth/resend-verification', body, noAuth),

  forgotPassword: (body: EmailOnlyRequest) =>
    apiClient.post<MessageResponse>('/auth/forgot-password', body, noAuth),

  resetPassword: (body: ResetPasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/reset-password', body, noAuth),
};
