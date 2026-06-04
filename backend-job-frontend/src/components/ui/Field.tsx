import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-flame-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-flame-700" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const controlBase =
  'w-full rounded-lg border bg-surface px-3.5 text-ink placeholder:text-muted/70 press ' +
  'focus:outline-none focus-visible:outline-none focus:border-flame-500 focus:ring-4 focus:ring-flame-500/10 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted';

export function controlBorder(hasError?: boolean): string {
  return hasError ? 'border-flame-400' : 'border-line-strong';
}
