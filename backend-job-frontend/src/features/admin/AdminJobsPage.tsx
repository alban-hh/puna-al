import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Briefcase, Eye, Sparkles, Trash2 } from 'lucide-react';
import { JOB_STATUSES, isApiError, type Job, type JobStatus } from '@/api';
import { useAdminJobs, useTakedownJob } from '@/api/hooks/useAdmin';
import { useFilterParams } from '@/hooks/useFilterParams';
import { useToast } from '@/context/useToast';
import { jobStatusLabels } from '@/lib/labels';
import { formatRelative, formatSalaryForJob } from '@/lib/format';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { JobStatusBadge } from '@/components/ui/StatusBadge';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';

export function AdminJobsPage() {
  const { get, set, page, setPage } = useFilterParams();
  const toast = useToast();
  const status = get('status') as JobStatus | '';
  const query = useAdminJobs({ page, per_page: 20, status: status || undefined });

  const takedown = useTakedownJob();
  const [target, setTarget] = useState<Job | null>(null);

  const confirmTakedown = () => {
    if (!target) return;
    takedown.mutate(target.id, {
      onSuccess: () => {
        toast.success('Puna u hoq nga platforma.');
        setTarget(null);
      },
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Veprimi dështoi.'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Select
          aria-label="Filtro sipas statusit"
          value={status}
          onChange={(event) => set('status', event.target.value)}
          containerClassName="w-56"
        >
          <option value="">Të gjitha statuset</option>
          {JOB_STATUSES.map((value) => (
            <option key={value} value={value}>
              {jobStatusLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <QueryBoundary
        query={query}
        loadingFallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-card" />
            ))}
          </div>
        }
        isEmpty={(data) => data.items.length === 0}
        emptyFallback={
          <EmptyState
            icon={Briefcase}
            title="Asnjë punë"
            description="Nuk ka punë që përputhen me filtrin."
          />
        }
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.items.map((job) => (
              <Card key={job.id}>
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
                      <span>
                        {job.city}, {job.qark}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Banknote className="size-4 text-pine-600" />
                        {formatSalaryForJob(job)}
                      </span>
                      <span>Krijuar {formatRelative(job.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="press inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:border-ink"
                    >
                      <Eye className="size-4" />
                      Shiko
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => setTarget(job)}
                    >
                      Hiqe
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
            <Pagination
              className="mt-4"
              page={data.page}
              perPage={data.per_page}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={Boolean(target)}
        title="Hiqe punën nga platforma"
        description={target?.title}
        confirmLabel="Hiqe"
        isLoading={takedown.isPending}
        onConfirm={confirmTakedown}
        onClose={() => setTarget(null)}
      >
        <p className="text-sm text-ink-soft">
          Puna do të fshihet (soft delete) dhe nuk do të shfaqet në listime.
        </p>
      </ConfirmDialog>
    </div>
  );
}
