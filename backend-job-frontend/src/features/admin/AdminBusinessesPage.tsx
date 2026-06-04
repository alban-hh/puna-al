import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, Eye, Pause, X } from 'lucide-react';
import { BUSINESS_STATUSES, isApiError, type Business, type BusinessStatus } from '@/api';
import { useAdminBusinesses, useApproveBusiness, useSuspendBusiness } from '@/api/hooks/useAdmin';
import { useFilterParams } from '@/hooks/useFilterParams';
import { useToast } from '@/context/useToast';
import { businessStatusLabels } from '@/lib/labels';
import { formatRelative } from '@/lib/format';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BusinessStatusBadge } from '@/components/ui/StatusBadge';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RejectBusinessDialog } from './RejectBusinessDialog';

export function AdminBusinessesPage() {
  const { get, set, page, setPage } = useFilterParams();
  const toast = useToast();
  const status = get('status') as BusinessStatus | '';
  const query = useAdminBusinesses({ page, per_page: 20, status: status || undefined });

  const approve = useApproveBusiness();
  const suspend = useSuspendBusiness();
  const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Business | null>(null);

  const pendingId = approve.isPending ? approve.variables : undefined;

  const onApprove = (business: Business) =>
    approve.mutate(business.id, {
      onSuccess: () => toast.success(`"${business.name}" u miratua.`),
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Miratimi dështoi.'),
    });

  const confirmSuspend = () => {
    if (!suspendTarget) return;
    suspend.mutate(suspendTarget.id, {
      onSuccess: () => {
        toast.success('Biznesi u pezullua.');
        setSuspendTarget(null);
      },
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Pezullimi dështoi.'),
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
          {BUSINESS_STATUSES.map((value) => (
            <option key={value} value={value}>
              {businessStatusLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <QueryBoundary
        query={query}
        loadingFallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-card" />
            ))}
          </div>
        }
        isEmpty={(data) => data.items.length === 0}
        emptyFallback={
          <EmptyState icon={Building2} title="Asnjë biznes" description="Nuk ka biznese që përputhen me filtrin." />
        }
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.items.map((business) => (
              <Card key={business.id}>
                <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-lg text-ink">{business.name}</h3>
                      <BusinessStatusBadge status={business.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="font-mono">{business.nipt}</span>
                      <span>
                        {business.city}, {business.qark}
                      </span>
                      <span>Regjistruar {formatRelative(business.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link
                      to={`/businesses/${business.id}`}
                      className="press inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:border-ink"
                    >
                      <Eye className="size-4" />
                      Shiko
                    </Link>
                    {business.status !== 'approved' && (
                      <Button
                        size="sm"
                        leftIcon={<Check className="size-4" />}
                        onClick={() => onApprove(business)}
                        isLoading={pendingId === business.id}
                      >
                        Mirato
                      </Button>
                    )}
                    {business.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<X className="size-4" />}
                        onClick={() => setRejectTarget(business)}
                      >
                        Refuzo
                      </Button>
                    )}
                    {business.status !== 'suspended' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Pause className="size-4" />}
                        onClick={() => setSuspendTarget(business)}
                      >
                        Pezullo
                      </Button>
                    )}
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

      <RejectBusinessDialog business={rejectTarget} onClose={() => setRejectTarget(null)} />
      <ConfirmDialog
        open={Boolean(suspendTarget)}
        title="Pezullo biznesin"
        description={suspendTarget?.name}
        confirmLabel="Pezullo"
        isLoading={suspend.isPending}
        onConfirm={confirmSuspend}
        onClose={() => setSuspendTarget(null)}
      >
        <p className="text-sm text-ink-soft">Biznesi do të bëhet i padukshëm dhe punët e tij nuk do të shfaqen.</p>
      </ConfirmDialog>
    </div>
  );
}
