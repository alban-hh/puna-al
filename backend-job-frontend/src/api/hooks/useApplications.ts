import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applicationsApi,
  accountApi,
  type ApplicationStatus,
  type CreateApplicationRequest,
  type PaginationParams,
} from '@/api';
import { queryKeys } from '@/api/queryKeys';

export function useMyApplications(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.me.applications(params),
    queryFn: () => accountApi.myApplications(params),
    placeholderData: keepPreviousData,
  });
}

export function useJobApplications(jobId: string | undefined, params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.jobs.applications(jobId ?? '', params),
    queryFn: () => applicationsApi.forJob(jobId as string, params),
    enabled: Boolean(jobId),
    placeholderData: keepPreviousData,
  });
}

export function useApplyToJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApplicationRequest) => applicationsApi.apply(jobId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'applications'] });
    },
  });
}

export function useUpdateApplicationStatus(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsApi.updateStatus(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', jobId, 'applications'] });
    },
  });
}
