import { apiClient } from '../client';
import type { PaginationParams, UpdateProfileRequest } from '../requests';
import type { ApplicantApplication, Page, User } from '../types';

export const accountApi = {
  me: () => apiClient.get<User>('/me'),

  updateProfile: (body: UpdateProfileRequest) => apiClient.patch<User>('/me', body),

  myApplications: (params: PaginationParams) =>
    apiClient.get<Page<ApplicantApplication>>('/me/applications', { params }),
};
