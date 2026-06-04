import { apiClient } from '../client';
import type {
  AdminBusinessListParams,
  AdminJobListParams,
  AdminUserListParams,
} from '../requests';
import type { AdminStats, Business, Job, Page, User } from '../types';

export const adminApi = {
  businesses: (params: AdminBusinessListParams) =>
    apiClient.get<Page<Business>>('/admin/businesses', { params }),

  approveBusiness: (id: string) => apiClient.post<Business>(`/admin/businesses/${id}/approve`),

  rejectBusiness: (id: string, reason: string) =>
    apiClient.post<Business>(`/admin/businesses/${id}/reject`, { reason }),

  suspendBusiness: (id: string) => apiClient.post<Business>(`/admin/businesses/${id}/suspend`),

  users: (params: AdminUserListParams) => apiClient.get<Page<User>>('/admin/users', { params }),

  suspendUser: (id: string) => apiClient.post<User>(`/admin/users/${id}/suspend`),

  jobs: (params: AdminJobListParams) => apiClient.get<Page<Job>>('/admin/jobs', { params }),

  takedownJob: (id: string) => apiClient.delete<void>(`/admin/jobs/${id}`),

  stats: () => apiClient.get<AdminStats>('/admin/stats'),
};
