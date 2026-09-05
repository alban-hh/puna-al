import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useJob } from '@/api/hooks/useJobs';
import { formatDate, formatRelative, formatSalaryForJob } from '@/lib/format';
import { employmentTypeLabels } from '@/lib/labels';
import { Container } from '@/components/layout/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { JobApplyPanel } from './JobApplyPanel';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useJob(id);

  return (
    <Container className="py-8">
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
          errorTitle="Puna nuk u gjet"
          loadingFallback={
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-72 w-full rounded-card" />
            </div>
          }
        >
          {(job) => (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <article className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="flame">{job.category_label}</Badge>
                  <Badge tone="neutral">{employmentTypeLabels[job.employment_type]}</Badge>
                  {job.remote && (
                    <Badge tone="pine">
                      <Wifi className="size-3.5" /> Në distancë
                    </Badge>
                  )}
                  {job.featured && (
                    <Badge tone="gold">
                      <Sparkles className="size-3.5" /> I promovuar
                    </Badge>
                  )}
                </div>

                <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">{job.title}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {job.city}, {job.qark}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <Banknote className="size-4 text-pine-600" />
                    {formatSalaryForJob(job)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {formatRelative(job.published_at ?? job.created_at)}
                  </span>
                </div>

                <div className="mt-8 border-t border-line pt-8">
                  <h2 className="font-display text-xl text-ink">Përshkrimi i punës</h2>
                  <p className="mt-4 leading-relaxed whitespace-pre-line text-ink-soft">
                    {job.description}
                  </p>
                </div>
              </article>

              <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
                <Card className={job.featured ? 'border-gold-200 ring-1 ring-gold-200' : undefined}>
                  <CardBody>
                    <JobApplyPanel job={job} />
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-surface-sunken text-ink">
                        <Building2 className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/businesses/${job.business.id}`}
                          className="block truncate font-display text-lg text-ink hover:text-flame-600"
                        >
                          {job.business.name}
                        </Link>
                        <p className="truncate text-sm text-muted">
                          {job.business.city}, {job.business.qark}
                        </p>
                      </div>
                    </div>
                    {job.business.website && (
                      <a
                        href={job.business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-flame-600 hover:underline"
                      >
                        <ExternalLink className="size-4" />
                        Vizito faqen
                      </a>
                    )}
                  </CardBody>
                </Card>

                {job.expires_at && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted">
                    <CalendarClock className="size-4" />
                    Skadon më {formatDate(job.expires_at)}
                  </p>
                )}
              </aside>
            </div>
          )}
        </QueryBoundary>
      </div>
    </Container>
  );
}
