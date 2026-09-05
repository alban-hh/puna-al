import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastInput,
  type ToastVariant,
} from './toast-context';

const DEFAULT_DURATION = 5000;

const variantStyles: Record<ToastVariant, { border: string; icon: ReactNode }> = {
  success: {
    border: 'border-l-pine-500',
    icon: <CheckCircle2 className="size-5 text-pine-600" />,
  },
  error: {
    border: 'border-l-flame-600',
    icon: <XCircle className="size-5 text-flame-600" />,
  },
  info: {
    border: 'border-l-gold-500',
    icon: <Info className="size-5 text-gold-600" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({ variant = 'info', title, message, durationMs = DEFAULT_DURATION }: ToastInput) => {
      const id = ++counter.current;
      setToasts((current) => [...current, { id, variant, title, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), durationMs),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, title) => show({ variant: 'success', message, title }),
      error: (message, title) => show({ variant: 'error', message, title }),
      info: (message, title) => show({ variant: 'info', message, title }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        role="region"
        aria-live="polite"
        aria-label="Njoftime"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line border-l-4 bg-surface p-4 shadow-pop',
              variantStyles[toast.variant].border,
            )}
          >
            <span className="mt-0.5 shrink-0">{variantStyles[toast.variant].icon}</span>
            <div className="min-w-0 flex-1">
              {toast.title && <p className="text-sm font-semibold text-ink">{toast.title}</p>}
              <p className="text-sm leading-snug text-ink-soft">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="press -m-1 rounded-md p-1 text-muted hover:bg-surface-sunken hover:text-ink"
              aria-label="Mbyll njoftimin"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
