import { useEffect, useRef, useState } from 'react';
import { Search, ShieldCheck, UserX } from 'lucide-react';
import { USER_STATUSES, isApiError, type User, type UserStatus } from '@/api';
import { useAdminUsers, useSuspendUser } from '@/api/hooks/useAdmin';
import { useFilterParams } from '@/hooks/useFilterParams';
import { useToast } from '@/context/useToast';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';
import { controlBase, controlBorder } from '@/components/ui/Field';

const userStatusLabels: Record<UserStatus, string> = {
  active: 'Aktiv',
  suspended: 'Pezulluar',
};

export function AdminUsersPage() {
  const { get, set, page, setPage } = useFilterParams();
  const toast = useToast();
  const status = get('status') as UserStatus | '';
  const q = get('q');
  const query = useAdminUsers({ page, per_page: 20, status: status || undefined, q: q || undefined });

  const suspend = useSuspendUser();
  const [target, setTarget] = useState<User | null>(null);

  const [qInput, setQInput] = useState(q);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const handle = setTimeout(() => set('q', qInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [qInput, set]);

  const confirmSuspend = () => {
    if (!target) return;
    suspend.mutate(target.id, {
      onSuccess: () => {
        toast.success('Përdoruesi u pezullua.');
        setTarget(null);
      },
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Pezullimi dështoi.'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            placeholder="Kërko sipas emrit ose email-it…"
            aria-label="Kërko përdorues"
            className={cn(controlBase, controlBorder(false), 'h-11 pl-11')}
          />
        </div>
        <Select
          aria-label="Filtro sipas statusit"
          value={status}
          onChange={(event) => set('status', event.target.value)}
          containerClassName="sm:w-48"
        >
          <option value="">Të gjithë</option>
          {USER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {userStatusLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <QueryBoundary
        query={query}
        loadingFallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-card" />
            ))}
          </div>
        }
        isEmpty={(data) => data.items.length === 0}
        emptyFallback={<EmptyState icon={UserX} title="Asnjë përdorues" description="Nuk ka përdorues që përputhen me kërkimin." />}
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.items.map((user) => (
              <Card key={user.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-surface-sunken text-sm font-semibold text-ink">
                      {user.full_name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{user.full_name}</p>
                        {user.role === 'admin' && (
                          <Badge tone="flame">
                            <ShieldCheck className="size-3.5" /> Admin
                          </Badge>
                        )}
                        <Badge tone={user.status === 'suspended' ? 'slate' : 'pine'}>
                          {userStatusLabels[user.status]}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted">
                        {user.email} · regjistruar {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>

                  {user.role !== 'admin' && user.status !== 'suspended' && (
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<UserX className="size-4" />}
                      onClick={() => setTarget(user)}
                    >
                      Pezullo
                    </Button>
                  )}
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
        title="Pezullo përdoruesin"
        description={target?.email}
        confirmLabel="Pezullo"
        isLoading={suspend.isPending}
        onConfirm={confirmSuspend}
        onClose={() => setTarget(null)}
      >
        <p className="text-sm text-ink-soft">
          Përdoruesi nuk do të mund të hyjë dhe sesionet e tij do të revokohen.
        </p>
      </ConfirmDialog>
    </div>
  );
}
