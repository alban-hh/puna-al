import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'flame' | 'gold' | 'pine' | 'amber' | 'slate';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-soft border-line',
  flame: 'bg-flame-50 text-flame-700 border-flame-100',
  gold: 'bg-gold-100 text-gold-600 border-gold-200',
  pine: 'bg-pine-100 text-pine-600 border-pine-100',
  amber: 'bg-amber-soft text-amber-ink border-amber-soft',
  slate: 'bg-slate-soft text-slate-ink border-slate-soft',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
