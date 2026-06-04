import { Building2, Pencil, Plus, SlidersHorizontal } from 'lucide-react';
import { useMyBusinesses } from '@/api/hooks/useBusinesses';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { BusinessStatusBadge } from '@/components/ui/StatusBadge';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';

export function MyBusinessesPage() {
  const query = useMyBusinesses();

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Punëdhënës"
        title="Bizneset e mia"
        description="Menaxhoni bizneset tuaja dhe ndiqni statusin e miratimit."
        actions={
          <ButtonLink to="/businesses/new" leftIcon={<Plus className="size-4" />}>
            Regjistro biznes
          </ButtonLink>
        }
      />

      <div className="mt-8">
        <QueryBoundary
          query={query}
          loadingFallback={
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-48 w-full rounded-card" />
              ))}
            </div>
          }
          isEmpty={(data) => data.length === 0}
          emptyFallback={
            <EmptyState
              icon={Building2}
              title="Ende pa biznese"
              description="Regjistroni biznesin tuaj për të filluar postimin e punëve. Pas miratimit nga administratori, mund të publikoni punë."
              action={
                <ButtonLink to="/businesses/new" leftIcon={<Plus className="size-4" />}>
                  Regjistro biznesin e parë
                </ButtonLink>
              }
            />
          }
        >
          {(businesses) => (
            <div className="grid gap-4 sm:grid-cols-2">
              {businesses.map((business) => (
                <Card key={business.id} className="flex flex-col">
                  <CardBody className="flex flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl text-ink">{business.name}</h3>
                        <p className="mt-0.5 font-mono text-xs tracking-wide text-muted">
                          {business.nipt}
                        </p>
                      </div>
                      <BusinessStatusBadge status={business.status} />
                    </div>

                    <p className="text-sm text-muted">
                      {business.city}, {business.qark}
                    </p>

                    {business.status === 'rejected' && business.rejection_reason && (
                      <Alert variant="warning">{business.rejection_reason}</Alert>
                    )}
                    {business.status === 'pending' && (
                      <Alert variant="info">Në pritje të miratimit nga administratori.</Alert>
                    )}

                    <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
                      <ButtonLink
                        to={`/businesses/${business.id}/jobs`}
                        size="sm"
                        leftIcon={<SlidersHorizontal className="size-4" />}
                      >
                        Menaxho punët
                      </ButtonLink>
                      <ButtonLink
                        to={`/businesses/${business.id}/edit`}
                        size="sm"
                        variant="secondary"
                        leftIcon={<Pencil className="size-4" />}
                      >
                        Modifiko
                      </ButtonLink>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
    </Container>
  );
}
