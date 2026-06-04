import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-sunken',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r',
        'before:from-transparent before:via-white/50 before:to-transparent',
        className,
      )}
      {...props}
    />
  );
}
