import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, Phone, SlidersHorizontal } from 'lucide-react';
import type { Business } from '@/api';
import { useBusiness } from '@/api/hooks/useBusinesses';
import { useAuth } from '@/context/useAuth';
import { Container } from '@/components/layout/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { BusinessStatusBadge } from '@/components/ui/StatusBadge';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';

export function BusinessProfilePage() {
  const { id } = useParams<{ id: string }>();
  const query = useBusiness(id);

  return (
    <Container className="max-w-3xl py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-flame-600"
      >
        <ArrowLeft className="size-4" />
        Kthehu te punët
      </Link>

      <div className="mt-6">
        <QueryBoundary
          query={query}
          errorTitle="Biznesi nuk u gjet"
          loadingFallback={<Skeleton className="h-80 w-full rounded-card" />}
        >
          {(business) => <BusinessProfile business={business} />}
        </QueryBoundary>
      </div>
    </Container>
  );
}

function BusinessProfile({ business }: { business: Business }) {
  const { user } = useAuth();
  const isOwner = user?.id === business.owner_id;

  return (
    <Card>
      <CardBody className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="size-16 shrink-0 rounded-xl border border-line object-cover"
            />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-ink text-2xl font-semibold text-paper">
              {business.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl text-ink sm:text-3xl">{business.name}</h1>
              {business.status !== 'approved' && <BusinessStatusBadge status={business.status} />}
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-4" />
              {business.city}, {business.qark}
            </p>
          </div>
        </div>

        <p className="leading-relaxed whitespace-pre-line text-ink-soft">{business.description}</p>

        <dl className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Adresa</dt>
            <dd className="mt-1 text-sm text-ink">{business.address}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Telefoni</dt>
            <dd className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink">
              <Phone className="size-4 text-muted" />
              <a href={`tel:${business.phone}`} className="hover:text-flame-600">
                {business.phone}
              </a>
            </dd>
          </div>
          {business.website && (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                Faqja web
              </dt>
              <dd className="mt-1">
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-flame-600 hover:underline"
                >
                  <ExternalLink className="size-4" />
                  {business.website}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {isOwner && (
          <div className="border-t border-line pt-5">
            <ButtonLink
              to={`/businesses/${business.id}/jobs`}
              leftIcon={<SlidersHorizontal className="size-4" />}
            >
              Menaxho punët
            </ButtonLink>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
