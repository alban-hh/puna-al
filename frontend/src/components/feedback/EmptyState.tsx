import { type ComponentType, type ReactNode } from 'react';
import { type LucideProps, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-sunken text-muted">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
