import type {
  AdminBusinessListParams,
  AdminJobListParams,
  AdminUserListParams,
  JobListParams,
  PaginationParams,
} from './requests';

export const queryKeys = {
  meta: {
    qarks: ['meta', 'qarks'] as const,
    categories: ['meta', 'categories'] as const,
  },
  me: {
    profile: ['me'] as const,
    applications: (params: PaginationParams) => ['me', 'applications', params] as const,
  },
  businesses: {
    mine: ['businesses', 'mine'] as const,
    detail: (id: string) => ['businesses', 'detail', id] as const,
    jobs: (id: string, params: PaginationParams) => ['businesses', id, 'jobs', params] as const,
  },
  jobs: {
    list: (params: JobListParams) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    applications: (jobId: string, params: PaginationParams) =>
      ['jobs', jobId, 'applications', params] as const,
  },
  admin: {
    businesses: (params: AdminBusinessListParams) => ['admin', 'businesses', params] as const,
    users: (params: AdminUserListParams) => ['admin', 'users', params] as const,
    jobs: (params: AdminJobListParams) => ['admin', 'jobs', params] as const,
    stats: ['admin', 'stats'] as const,
  },
} as const;
