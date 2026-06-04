import { apiClient } from '../client';
import type {
  CreateBusinessRequest,
  PaginationParams,
  UpdateBusinessRequest,
} from '../requests';
import type { Business, Job, Page } from '../types';

export const businessesApi = {
  create: (body: CreateBusinessRequest) => apiClient.post<Business>('/businesses', body),

  mine: () => apiClient.get<Business[]>('/businesses/mine'),

  byId: (id: string) => apiClient.get<Business>(`/businesses/${id}`),

  update: (id: string, body: UpdateBusinessRequest) =>
    apiClient.patch<Business>(`/businesses/${id}`, body),

  jobs: (id: string, params: PaginationParams) =>
    apiClient.get<Page<Job>>(`/businesses/${id}/jobs`, { params }),
};
