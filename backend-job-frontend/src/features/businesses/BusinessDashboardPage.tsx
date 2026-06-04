import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Pencil, Plus } from 'lucide-react';
import { isApiError, type Business, type Job } from '@/api';
import { useBusiness, useBusinessJobs } from '@/api/hooks/useBusinesses';
import { useCloseJob, useDeleteJob, usePublishJob } from '@/api/hooks/useJobs';
import { usePageParam } from '@/hooks/usePageParam';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Pagination } from '@/components/ui/Pagination';
import { BusinessStatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';
import { OwnerJobCard } from '@/features/jobs/OwnerJobCard';
import { JobFormModal } from '@/features/jobs/JobFormModal';
import { PromoteDialog } from '@/features/jobs/PromoteDialog';

export function BusinessDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const businessQuery = useBusiness(id);

  return (
    <Container className="py-10">
      <Link
        to="/businesses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-flame-600"
      >
        <ArrowLeft className="size-4" />
        Bizneset e mia
      </Link>

      <div className="mt-6">
        <QueryBoundary
          query={businessQuery}
          errorTitle="Biznesi nuk u gjet"
          loadingFallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-32 w-full rounded-card" />
              <Skeleton className="h-32 w-full rounded-card" />
            </div>
          }
        >
          {(business) => <DashboardContent business={business} />}
        </QueryBoundary>
      </div>
    </Container>
  );
}

function DashboardContent({ business }: { business: Business }) {
  const { isVerified } = useAuth();
  const toast = useToast();
  const { page, perPage, setPage } = usePageParam();
  const jobsQuery = useBusinessJobs(business.id, { page, per_page: perPage });

  const publish = usePublishJob();
  const close = useCloseJob();
  const remove = useDeleteJob();

  const [createOpen, setCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [promoteJob, setPromoteJob] = useState<Job | null>(null);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);

  const approved = business.status === 'approved';
  const canPost = approved && isVerified;

  const pendingJobId = publish.isPending
    ? publish.variables
    : close.isPending
      ? close.variables
      : undefined;

  const withToast = (label: string) => ({
    onSuccess: () => toast.success(label),
    onError: (error: unknown) =>
      toast.error(isApiError(error) ? error.message : 'Veprimi dështoi.'),
  });

  const confirmDelete = () => {
    if (!deleteJob) return;
    remove.mutate(deleteJob.id, {
      onSuccess: () => {
        toast.success('Puna u fshi.');
        setDeleteJob(null);
      },
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Fshirja dështoi.'),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Paneli i biznesit"
        title={business.name}
        description="Krijoni, publikoni dhe promovoni punët e këtij biznesi."
        actions={
          <>
            <BusinessStatusBadge status={business.status} />
            <ButtonLink
              to={`/businesses/${business.id}/edit`}
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="size-4" />}
            >
              Modifiko biznesin
            </ButtonLink>
            <Button
              size="sm"
              leftIcon={<Plus className="size-4" />}
              onClick={() => setCreateOpen(true)}
              disabled={!canPost}
              title={canPost ? undefined : 'Kërkohet biznes i miratuar dhe email i verifikuar'}
            >
              Posto punë
            </Button>
          </>
        }
      />

      {!approved && (
        <Alert
          className="mt-6"
          variant={business.status === 'rejected' ? 'warning' : 'info'}
          title="Postimi i punëve është i kufizuar"
        >
          {business.status === 'pending' &&
            'Biznesi është në pritje të miratimit. Pasi të miratohet, mund të publikoni punë.'}
          {business.status === 'rejected' &&
            (business.rejection_reason
              ? `Biznesi u refuzua: ${business.rejection_reason} Modifikoni të dhënat për ta ridërguar.`
              : 'Biznesi u refuzua. Modifikoni të dhënat për ta ridërguar.')}
          {business.status === 'suspended' &&
            'Biznesi është pezulluar. Kontaktoni administratorin.'}
        </Alert>
      )}
      {approved && !isVerified && (
        <Alert className="mt-6" variant="warning">
          Verifikoni email-in tuaj për të postuar dhe publikuar punë.
        </Alert>
      )}

      <div className="mt-8">
        <QueryBoundary
          query={jobsQuery}
          loadingFallback={
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-card" />
              ))}
            </div>
          }
          isEmpty={(data) => data.items.length === 0}
          emptyFallback={
            <EmptyState
              icon={Briefcase}
              title="Ende pa punë"
              description={
                canPost
                  ? 'Postoni punën tuaj të parë. Ruhet si draft derisa ta publikoni.'
                  : 'Sapo biznesi të miratohet dhe email-i të verifikohet, mund të postoni punë.'
              }
              action={
                canPost ? (
                  <Button
                    leftIcon={<Plus className="size-4" />}
                    onClick={() => setCreateOpen(true)}
                  >
                    Posto punë
                  </Button>
                ) : undefined
              }
            />
          }
        >
          {(data) => (
            <div className="flex flex-col gap-3">
              {data.items.map((job) => (
                <OwnerJobCard
                  key={job.id}
                  job={job}
                  approved={approved}
                  pendingJobId={pendingJobId}
                  onEdit={setEditJob}
                  onPromote={setPromoteJob}
                  onDelete={setDeleteJob}
                  onPublish={(target) => publish.mutate(target.id, withToast('Puna u publikua.'))}
                  onClose={(target) => close.mutate(target.id, withToast('Puna u mbyll.'))}
                />
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
      </div>

      <JobFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        businessId={business.id}
      />
      {editJob && (
        <JobFormModal
          open
          onClose={() => setEditJob(null)}
          businessId={business.id}
          job={editJob}
        />
      )}
      {promoteJob && <PromoteDialog open onClose={() => setPromoteJob(null)} job={promoteJob} />}
      <ConfirmDialog
        open={Boolean(deleteJob)}
        title="Fshi punën"
        description={deleteJob?.title}
        confirmLabel="Fshi"
        confirmVariant="primary"
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteJob(null)}
      >
        <p className="text-sm text-ink-soft">
          Jeni i sigurt? Puna do të hiqet nga të gjitha listat. Ky veprim nuk mund të kthehet.
        </p>
      </ConfirmDialog>
    </>
  );
}
