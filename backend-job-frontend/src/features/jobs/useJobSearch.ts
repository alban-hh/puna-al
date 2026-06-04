import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EmploymentType, JobListParams, JobSort, Qark } from '@/api';

export type JobFilterKey =
  | 'q'
  | 'category'
  | 'qark'
  | 'employment_type'
  | 'city'
  | 'remote'
  | 'featured'
  | 'sort';

export function useJobSearch(perPage = 12) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const filters = useMemo<JobListParams>(() => {
    const remote = searchParams.get('remote') === 'true' ? true : undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    return {
      page,
      per_page: perPage,
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      qark: (searchParams.get('qark') as Qark) || undefined,
      employment_type: (searchParams.get('employment_type') as EmploymentType) || undefined,
      city: searchParams.get('city') || undefined,
      remote,
      featured,
      sort: (searchParams.get('sort') as JobSort) || undefined,
    };
  }, [searchParams, page, perPage]);

  const setParam = useCallback(
    (key: JobFilterKey, value: string | boolean | undefined) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (value === undefined || value === '' || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
        params.delete('page');
        return params;
      });
    },
    [setSearchParams],
  );

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

  const clear = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  const activeFilterCount = (['q', 'category', 'qark', 'employment_type', 'city', 'remote', 'featured'] as const).filter(
    (key) => searchParams.get(key),
  ).length;

  return { filters, page, setParam, setPage, clear, searchParams, activeFilterCount };
}
