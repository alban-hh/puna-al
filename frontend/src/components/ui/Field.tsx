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
