export const ROLES = ['user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const BUSINESS_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const JOB_STATUSES = ['draft', 'published', 'closed', 'expired'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const APPLICATION_STATUSES = [
  'submitted',
  'reviewed',
  'shortlisted',
  'rejected',
  'hired',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const SALARY_PERIODS = ['month', 'year'] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export const QARKS = [
  'Berat',
  'Dibër',
  'Durrës',
  'Elbasan',
  'Fier',
  'Gjirokastër',
  'Korçë',
  'Kukës',
  'Lezhë',
  'Shkodër',
  'Tiranë',
  'Vlorë',
] as const;
export type Qark = (typeof QARKS)[number];

export const JOB_SORTS = ['newest', 'oldest', 'salary_high', 'salary_low'] as const;
export type JobSort = (typeof JOB_SORTS)[number];

export interface MetaItem {
  value: string;
  label: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  nipt: string;
  description: string;
  qark: Qark;
  city: string;
  address: string;
  phone: string;
  website: string | null;
  logo_url: string | null;
  status: BusinessStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessSummary {
  id: string;
  name: string;
  qark: Qark;
  city: string;
  website: string | null;
  logo_url: string | null;
}

export interface Job {
  id: string;
  business_id: string;
  title: string;
  description: string;
  category: string;
  category_label: string;
  employment_type: EmploymentType;
  qark: Qark;
  city: string;
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod | null;
  salary_currency: 'ALL';
  status: JobStatus;
  featured: boolean;
  featured_until: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobDetail extends Job {
  business: BusinessSummary;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  cv_url: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationApplicant {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface JobApplication extends Application {
  applicant: JobApplicationApplicant;
}

export interface ApplicantApplicationJob {
  id: string;
  title: string;
  city: string;
  business_name: string;
}

export interface ApplicantApplication extends Application {
  job: ApplicantApplicationJob;
}

export interface AdminStats {
  total_users: number;
  suspended_users: number;
  total_businesses: number;
  pending_businesses: number;
  approved_businesses: number;
  total_jobs: number;
  published_jobs: number;
  total_applications: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}

export interface MessageResponse {
  message: string;
}
