import { createContext } from 'react';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  login: (body: LoginRequest) => Promise<User>;
  register: (body: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  applyAuthResponse: (auth: AuthResponse) => void;
  refetchUser: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
