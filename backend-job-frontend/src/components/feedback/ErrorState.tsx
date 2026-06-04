import { AlertOctagon, RotateCw } from 'lucide-react';
import { isApiError } from '@/api';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function resolveErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ndodhi një gabim i papritur.';
}

export function ErrorState({ error, onRetry, title = 'Diçka shkoi keq' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-flame-200 bg-flame-50 px-6 py-14 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-flame-100 text-flame-600">
        <AlertOctagon className="size-7" strokeWidth={1.5} />
      </span>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-flame-800">{resolveErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" leftIcon={<RotateCw className="size-4" />} onClick={onRetry}>
          Provo përsëri
        </Button>
      )}
    </div>
  );
}
