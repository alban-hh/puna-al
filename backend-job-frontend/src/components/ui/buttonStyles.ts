import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-flame-600 text-white shadow-card hover:bg-flame-700 disabled:bg-flame-300 disabled:shadow-none',
  secondary:
    'bg-surface text-ink border border-line-strong hover:border-ink hover:bg-surface-sunken disabled:text-muted',
  ghost: 'bg-transparent text-ink hover:bg-surface-sunken disabled:text-muted',
  danger: 'bg-transparent text-flame-700 border border-flame-200 hover:bg-flame-50',
  gold: 'bg-gold-500 text-white shadow-card hover:bg-gold-600 disabled:bg-gold-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-7 text-base gap-2 rounded-xl',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
): string {
  return cn(
    'press inline-flex items-center justify-center font-medium whitespace-nowrap select-none disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
  );
}
