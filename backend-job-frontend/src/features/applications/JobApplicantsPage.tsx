import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { isApiError, type ApplicationStatus } from '@/api';
import { useJob } from '@/api/hooks/useJobs';
import { useJobApplications, useUpdateApplicationStatus } from '@/api/hooks/useApplications';
import { usePageParam } from '@/hooks/usePageParam';
import { useToast } from '@/context/useToast';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ApplicantCard } from './ApplicantCard';

export function JobApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { page, perPage, setPage } = usePageParam();
  const toast = useToast();

  const jobQuery = useJob(jobId);
  const applicationsQuery = useJobApplications(jobId, { page, per_page: perPage });
  const updateStatus = useUpdateApplicationStatus(jobId ?? '');

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success('Statusi i aplikimit u përditësua.'),
        onError: (error) => toast.error(isApiError(error) ? error.message : 'Përditësimi dështoi.'),
      },
    );
  };

  return (
    <Container className="py-10">
      <Link
        to="/businesses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-flame-600"
      >
        <ArrowLeft className="size-4" />
        Bizneset e mia
      </Link>

      <PageHeader
        className="mt-6"
        eyebrow="Aplikantët"
        title={jobQuery.data?.title ?? 'Aplikantët'}
        description="Shqyrtoni aplikantët dhe lëvizni ata nëpër fazat e përzgjedhjes."
      />

      <div className="mt-8">
        <QueryBoundary
          query={applicationsQuery}
          errorTitle="Nuk mund të shfaqen aplikantët"
          loadingFallback={
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-card" />
              ))}
            </div>
          }
          isEmpty={(data) => data.items.length === 0}
          emptyFallback={
            <EmptyState
              icon={Users}
              title="Ende pa aplikantë"
              description="Kur dikush të aplikojë për këtë punë, do ta shihni këtu me të dhënat e kontaktit."
            />
          }
        >
          {(data) => (
            <div className="flex flex-col gap-3">
              {data.items.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  pending={updateStatus.isPending && updateStatus.variables?.id === application.id}
                  onStatusChange={handleStatusChange}
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
    </Container>
  );
}
