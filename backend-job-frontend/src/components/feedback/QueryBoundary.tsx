import { type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { ErrorState } from './ErrorState';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  loadingFallback: ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyFallback?: ReactNode;
  errorTitle?: string;
}

export function QueryBoundary<T>({
  query,
  children,
  loadingFallback,
  isEmpty,
  emptyFallback,
  errorTitle,
}: QueryBoundaryProps<T>) {
  if (query.isPending) {
    return <>{loadingFallback}</>;
  }

  if (query.isError) {
    return (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} title={errorTitle} />
    );
  }

  if (isEmpty && emptyFallback && isEmpty(query.data)) {
    return <>{emptyFallback}</>;
  }

  return <>{children(query.data)}</>;
}
