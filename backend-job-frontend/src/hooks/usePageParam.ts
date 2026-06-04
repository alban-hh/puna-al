import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function usePageParam(perPage = 20) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next <= 1) {
            params.delete('page');
          } else {
            params.set('page', String(next));
          }
          return params;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  return { page, perPage, setPage };
}
