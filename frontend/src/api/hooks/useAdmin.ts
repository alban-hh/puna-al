import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  type AdminBusinessListParams,
  type AdminJobListParams,
  type AdminUserListParams,
} from '@/api';
import { queryKeys } from '@/api/queryKeys';

export function useAdminStats() {
  return useQuery({ queryKey: queryKeys.admin.stats, queryFn: adminApi.stats });
}

export function useAdminBusinesses(params: AdminBusinessListParams) {
  return useQuery({
    queryKey: queryKeys.admin.businesses(params),
    queryFn: () => adminApi.businesses(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminApi.users(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminJobs(params: AdminJobListParams) {
  return useQuery({
    queryKey: queryKeys.admin.jobs(params),
    queryFn: () => adminApi.jobs(params),
    placeholderData: keepPreviousData,
  });
}

function useInvalidate(prefix: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', prefix] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
  };
}

export function useApproveBusiness() {
  const invalidate = useInvalidate('businesses');
  return useMutation({
    mutationFn: (id: string) => adminApi.approveBusiness(id),
    onSuccess: invalidate,
  });
}

export function useRejectBusiness() {
  const invalidate = useInvalidate('businesses');
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectBusiness(id, reason),
    onSuccess: invalidate,
  });
}

export function useSuspendBusiness() {
  const invalidate = useInvalidate('businesses');
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendBusiness(id),
    onSuccess: invalidate,
  });
}

export function useSuspendUser() {
  const invalidate = useInvalidate('users');
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id),
    onSuccess: invalidate,
  });
}

export function useTakedownJob() {
  const invalidate = useInvalidate('jobs');
  return useMutation({
    mutationFn: (id: string) => adminApi.takedownJob(id),
    onSuccess: invalidate,
  });
}
