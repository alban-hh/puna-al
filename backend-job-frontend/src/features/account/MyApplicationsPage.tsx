import { Link } from 'react-router-dom';
import { Building2, FileText, MapPin } from 'lucide-react';
import { useMyApplications } from '@/api/hooks/useApplications';
import { usePageParam } from '@/hooks/usePageParam';
import { formatRelative } from '@/lib/format';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ButtonLink } from '@/components/ui/ButtonLink';

export function MyApplicationsPage() {
  const { page, perPage, setPage } = usePageParam();
  const query = useMyApplications({ page, per_page: perPage });

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Llogaria"
        title="Aplikimet e mia"
        description="Ndiqni statusin e çdo aplikimi që keni dërguar."
      />

      <div className="mt-8">
        <QueryBoundary
          query={query}
          loadingFallback={
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-card" />
              ))}
            </div>
          }
          isEmpty={(data) => data.items.length === 0}
          emptyFallback={
            <EmptyState
              icon={FileText}
              title="Ende pa aplikime"
              description="Kur të aplikoni për një punë, do ta gjeni këtu me statusin përkatës."
              action={<ButtonLink to="/">Shfleto punët</ButtonLink>}
            />
          }
        >
          {(data) => (
            <div className="flex flex-col gap-3">
              {data.items.map((application) => (
                <Card key={application.id} className="press hover:shadow-lift">
                  <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        to={`/jobs/${application.job.id}`}
                        className="font-display text-lg text-ink hover:text-flame-600"
                      >
                        {application.job.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-4" />
                          {application.job.business_name}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4" />
                          {application.job.city}
                        </span>
                        <span>Aplikuar {formatRelative(application.created_at)}</span>
                      </div>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
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
      </div>
    </Container>
  );
}
