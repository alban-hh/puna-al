import { Mail, Phone } from 'lucide-react';
import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication } from '@/api';
import { applicationStatusLabels } from '@/lib/labels';
import { formatRelative } from '@/lib/format';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';

interface ApplicantCardProps {
  application: JobApplication;
  pending: boolean;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicantCard({ application, pending, onStatusChange }: ApplicantCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg text-ink">{application.applicant.full_name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <a
                href={`mailto:${application.applicant.email}`}
                className="inline-flex items-center gap-1.5 hover:text-flame-600"
              >
                <Mail className="size-4" />
                {application.applicant.email}
              </a>
              {application.applicant.phone && (
                <a
                  href={`tel:${application.applicant.phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-flame-600"
                >
                  <Phone className="size-4" />
                  {application.applicant.phone}
                </a>
              )}
            </div>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </div>

        {application.cover_letter && (
          <div className="rounded-lg bg-surface-sunken p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Letra motivuese
            </p>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
              {application.cover_letter}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            {application.cv_url && (
              <a
                href={application.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-flame-600 hover:underline"
              >
                Shiko CV-në →
              </a>
            )}
            <span className="text-sm text-muted">
              Aplikoi {formatRelative(application.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {pending && <Spinner className="size-4 text-flame-600" />}
            <Select
              aria-label="Ndrysho statusin"
              value={application.status}
              disabled={pending}
              onChange={(event) =>
                onStatusChange(application.id, event.target.value as ApplicationStatus)
              }
              className="h-9 text-sm"
              containerClassName="w-44"
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {applicationStatusLabels[status]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
