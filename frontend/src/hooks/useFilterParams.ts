import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback((key: string) => searchParams.get(key) ?? '', [searchParams]);

  const set = useCallback(
    (key: string, value: string) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (value) params.set(key, value);
        else params.delete(key);
        params.delete('page');
        return params;
      });
    },
    [setSearchParams],
  );

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setPage = useCallback(
    (next: number) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next <= 1) params.delete('page');
        else params.set('page', String(next));
        return params;
      });
    },
    [setSearchParams],
  );

  return { get, set, page, setPage };
}
