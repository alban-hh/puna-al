import { cn } from '@/lib/cn';

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = 'Duke u ngarkuar' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-4 animate-[spin_0.6s_linear_infinite] rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}
