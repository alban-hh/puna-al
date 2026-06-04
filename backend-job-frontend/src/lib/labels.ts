import type {
  ApplicationStatus,
  BusinessStatus,
  EmploymentType,
  JobSort,
  JobStatus,
  SalaryPeriod,
} from '@/api';

export const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Kohë e plotë',
  part_time: 'Kohë e pjesshme',
  contract: 'Kontratë',
  internship: 'Praktikë',
  temporary: 'I përkohshëm',
};

export const jobStatusLabels: Record<JobStatus, string> = {
  draft: 'Draft',
  published: 'Publikuar',
  closed: 'Mbyllur',
  expired: 'Skaduar',
};

export const businessStatusLabels: Record<BusinessStatus, string> = {
  pending: 'Në pritje',
  approved: 'Miratuar',
  rejected: 'Refuzuar',
  suspended: 'Pezulluar',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: 'Dorëzuar',
  reviewed: 'Shqyrtuar',
  shortlisted: 'Përzgjedhur',
  rejected: 'Refuzuar',
  hired: 'Punësuar',
};

export const salaryPeriodLabels: Record<SalaryPeriod, string> = {
  month: 'muaj',
  year: 'vit',
};

export const jobSortLabels: Record<JobSort, string> = {
  newest: 'Më të rejat',
  oldest: 'Më të vjetrat',
  salary_high: 'Paga: më e lartë',
  salary_low: 'Paga: më e ulët',
};
