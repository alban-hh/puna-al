import { Spinner } from '@/components/ui/Spinner';

export function FullPageLoader({ label = 'Duke u ngarkuar…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-muted">
      <Spinner className="size-7 text-flame-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
