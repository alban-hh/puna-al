import { apiClient } from '../client';
import type {
  CreateApplicationRequest,
  PaginationParams,
  UpdateApplicationStatusRequest,
} from '../requests';
import type { Application, JobApplication, Page } from '../types';

export const applicationsApi = {
  apply: (jobId: string, body: CreateApplicationRequest) =>
    apiClient.post<Application>(`/jobs/${jobId}/applications`, body),

  forJob: (jobId: string, params: PaginationParams) =>
    apiClient.get<Page<JobApplication>>(`/jobs/${jobId}/applications`, { params }),

  updateStatus: (id: string, body: UpdateApplicationStatusRequest) =>
    apiClient.patch<Application>(`/applications/${id}`, body),
};
