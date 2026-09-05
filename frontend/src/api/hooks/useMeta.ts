import { useQuery } from '@tanstack/react-query';
import { metaApi } from '@/api';
import { queryKeys } from '@/api/queryKeys';

const META_STALE = 60 * 60_000;

export function useQarks() {
  return useQuery({
    queryKey: queryKeys.meta.qarks,
    queryFn: metaApi.qarks,
    staleTime: META_STALE,
    gcTime: META_STALE,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.meta.categories,
    queryFn: metaApi.categories,
    staleTime: META_STALE,
    gcTime: META_STALE,
  });
}
