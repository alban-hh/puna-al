import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi, type CreateJobRequest, type JobListParams, type UpdateJobRequest } from '@/api';
import { queryKeys } from '@/api/queryKeys';

export function useJobsList(params: JobListParams) {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => jobsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id ?? ''),
    queryFn: () => jobsApi.byId(id as string),
    enabled: Boolean(id),
  });
}

function useJobCacheInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'businesses' && query.queryKey[2] === 'jobs',
    });
  };
}

export function useCreateJob() {
  const invalidate = useJobCacheInvalidation();
  return useMutation({
    mutationFn: (body: CreateJobRequest) => jobsApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateJob(id: string) {
  const invalidate = useJobCacheInvalidation();
  return useMutation({
    mutationFn: (body: UpdateJobRequest) => jobsApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteJob() {
  const invalidate = useJobCacheInvalidation();
  return useMutation({
    mutationFn: (id: string) => jobsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function usePublishJob() {
  const invalidate = useJobCacheInvalidation();
  return useMutation({
    mutationFn: (id: string) => jobsApi.publish(id),
    onSuccess: invalidate,
  });
}

export function useCloseJob() {
  const invalidate = useJobCacheInvalidation();
  return useMutation({
    mutationFn: (id: string) => jobsApi.close(id),
    onSuccess: invalidate,
  });
}

export function usePromoteJob() {
  const invalidate = useJobCacheInvalidation();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => jobsApi.promote(id, days),
    onSuccess: invalidate,
  });
}
