import { type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

const config: Record<AlertVariant, { wrap: string; icon: ReactNode }> = {
  error: {
    wrap: 'bg-flame-50 border-flame-200 text-flame-800',
    icon: <XCircle className="size-5 text-flame-600" />,
  },
  success: {
    wrap: 'bg-pine-100 border-pine-100 text-pine-600',
    icon: <CheckCircle2 className="size-5 text-pine-600" />,
  },
  info: {
    wrap: 'bg-surface-sunken border-line text-ink-soft',
    icon: <Info className="size-5 text-ink-soft" />,
  },
  warning: {
    wrap: 'bg-amber-soft border-amber-soft text-amber-ink',
    icon: <AlertTriangle className="size-5 text-amber-ink" />,
  },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  return (
    <div
      className={cn('flex items-start gap-3 rounded-lg border p-4', config[variant].wrap, className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">{config[variant].icon}</span>
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}
