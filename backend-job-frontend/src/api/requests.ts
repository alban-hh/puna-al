import type {
  ApplicationStatus,
  BusinessStatus,
  EmploymentType,
  JobSort,
  JobStatus,
  Qark,
  SalaryPeriod,
  UserStatus,
} from './types';

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface EmailOnlyRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
}

export interface CreateBusinessRequest {
  name: string;
  nipt: string;
  description: string;
  qark: Qark;
  city: string;
  address: string;
  phone: string;
  website?: string;
  logo_url?: string;
}

export type UpdateBusinessRequest = Partial<Omit<CreateBusinessRequest, 'nipt'>>;

export interface CreateJobRequest {
  business_id: string;
  title: string;
  description: string;
  category: string;
  employment_type: EmploymentType;
  qark: Qark;
  city: string;
  remote?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: SalaryPeriod | null;
  expires_at?: string | null;
}

export type UpdateJobRequest = Partial<Omit<CreateJobRequest, 'business_id'>>;

export interface PromoteJobRequest {
  days: number;
}

export interface CreateApplicationRequest {
  cover_letter?: string;
  cv_url?: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}

export interface RejectBusinessRequest {
  reason: string;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface JobListParams extends PaginationParams {
  q?: string;
  category?: string;
  qark?: Qark;
  employment_type?: EmploymentType;
  city?: string;
  remote?: boolean;
  featured?: boolean;
  sort?: JobSort;
}

export interface AdminBusinessListParams extends PaginationParams {
  status?: BusinessStatus;
}

export interface AdminUserListParams extends PaginationParams {
  status?: UserStatus;
  q?: string;
}

export interface AdminJobListParams extends PaginationParams {
  status?: JobStatus;
  business_id?: string;
}
