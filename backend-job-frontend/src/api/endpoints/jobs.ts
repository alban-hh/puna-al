import { apiClient } from '../client';
import type { CreateJobRequest, JobListParams, UpdateJobRequest } from '../requests';
import type { Job, JobDetail, Page } from '../types';

export const jobsApi = {
  list: (params: JobListParams) => apiClient.get<Page<Job>>('/jobs', { params, auth: false }),

  byId: (id: string) => apiClient.get<JobDetail>(`/jobs/${id}`, { auth: false }),

  create: (body: CreateJobRequest) => apiClient.post<Job>('/jobs', body),

  update: (id: string, body: UpdateJobRequest) => apiClient.patch<Job>(`/jobs/${id}`, body),

  remove: (id: string) => apiClient.delete<void>(`/jobs/${id}`),

  publish: (id: string) => apiClient.post<Job>(`/jobs/${id}/publish`),

  close: (id: string) => apiClient.post<Job>(`/jobs/${id}/close`),

  promote: (id: string, days: number) => apiClient.post<Job>(`/jobs/${id}/promote`, { days }),
};
