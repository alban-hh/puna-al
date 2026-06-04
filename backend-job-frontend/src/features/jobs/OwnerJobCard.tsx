import { Link } from 'react-router-dom';
import { Banknote, CheckCircle, Pencil, Sparkles, Trash2, Users, XCircle } from 'lucide-react';
import type { Job } from '@/api';
import { formatRelative, formatSalaryForJob } from '@/lib/format';
import { employmentTypeLabels } from '@/lib/labels';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobStatusBadge } from '@/components/ui/StatusBadge';

interface OwnerJobCardProps {
  job: Job;
  approved: boolean;
  pendingJobId: string | undefined;
  onEdit: (job: Job) => void;
  onPublish: (job: Job) => void;
  onClose: (job: Job) => void;
  onPromote: (job: Job) => void;
  onDelete: (job: Job) => void;
}

export function OwnerJobCard({
  job,
  approved,
  pendingJobId,
  onEdit,
  onPublish,
  onClose,
  onPromote,
  onDelete,
}: OwnerJobCardProps) {
  const busy = pendingJobId === job.id;
  const canViewApplicants = job.status !== 'draft';

  return (
    <Card className={job.featured ? 'border-gold-200' : undefined}>
      <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            {job.featured && (
              <Badge tone="gold">
                <Sparkles className="size-3.5" /> I promovuar
              </Badge>
            )}
          </div>
          <h3 className="mt-2 truncate font-display text-lg text-ink">{job.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>{job.category_label}</span>
            <span>{employmentTypeLabels[job.employment_type]}</span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="size-4 text-pine-600" />
              {formatSalaryForJob(job)}
            </span>
            <span>Krijuar {formatRelative(job.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {canViewApplicants && (
            <Link
              to={`/jobs/${job.id}/applicants`}
              className="press inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:border-ink"
            >
              <Users className="size-4" />
              Aplikantët
            </Link>
          )}
          <Button size="sm" variant="secondary" leftIcon={<Pencil className="size-4" />} onClick={() => onEdit(job)} disabled={busy}>
            Modifiko
          </Button>
          {job.status !== 'published' && (
            <Button
              size="sm"
              leftIcon={<CheckCircle className="size-4" />}
              onClick={() => onPublish(job)}
              isLoading={busy}
              disabled={!approved}
              title={approved ? undefined : 'Biznesi duhet të miratohet së pari'}
            >
              Publiko
            </Button>
          )}
          {job.status === 'published' && (
            <>
              <Button size="sm" variant="gold" leftIcon={<Sparkles className="size-4" />} onClick={() => onPromote(job)} disabled={busy}>
                Promovo
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<XCircle className="size-4" />} onClick={() => onClose(job)} isLoading={busy}>
                Mbyll
              </Button>
            </>
          )}
          <Button size="sm" variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => onDelete(job)} disabled={busy}>
            Fshi
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
