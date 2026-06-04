import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
}

export interface ToastInput {
  variant?: ToastVariant;
  title?: string;
  message: string;
  durationMs?: number;
}

export interface ToastContextValue {
  show: (input: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
