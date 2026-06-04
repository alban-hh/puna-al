import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  businessesApi,
  type CreateBusinessRequest,
  type PaginationParams,
  type UpdateBusinessRequest,
} from '@/api';
import { queryKeys } from '@/api/queryKeys';

export function useMyBusinesses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.businesses.mine,
    queryFn: businessesApi.mine,
    enabled,
  });
}

export function useBusiness(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.businesses.detail(id ?? ''),
    queryFn: () => businessesApi.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useBusinessJobs(id: string | undefined, params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.businesses.jobs(id ?? '', params),
    queryFn: () => businessesApi.jobs(id as string, params),
    enabled: Boolean(id),
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBusinessRequest) => businessesApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.mine });
    },
  });
}

export function useUpdateBusiness(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBusinessRequest) => businessesApi.update(id, body),
    onSuccess: (business) => {
      queryClient.setQueryData(queryKeys.businesses.detail(id), business);
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.mine });
    },
  });
}
