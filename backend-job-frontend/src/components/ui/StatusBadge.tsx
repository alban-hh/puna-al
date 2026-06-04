import type { ApplicationStatus, BusinessStatus, JobStatus } from '@/api';
import {
  applicationStatusLabels,
  businessStatusLabels,
  jobStatusLabels,
} from '@/lib/labels';
import { Badge, type BadgeTone } from './Badge';

const businessTone: Record<BusinessStatus, BadgeTone> = {
  pending: 'amber',
  approved: 'pine',
  rejected: 'flame',
  suspended: 'slate',
};

const jobTone: Record<JobStatus, BadgeTone> = {
  draft: 'slate',
  published: 'pine',
  closed: 'neutral',
  expired: 'amber',
};

const applicationTone: Record<ApplicationStatus, BadgeTone> = {
  submitted: 'neutral',
  reviewed: 'amber',
  shortlisted: 'gold',
  rejected: 'flame',
  hired: 'pine',
};

export function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  return <Badge tone={businessTone[status]}>{businessStatusLabels[status]}</Badge>;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={jobTone[status]}>{jobStatusLabels[status]}</Badge>;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={applicationTone[status]}>{applicationStatusLabels[status]}</Badge>;
}
