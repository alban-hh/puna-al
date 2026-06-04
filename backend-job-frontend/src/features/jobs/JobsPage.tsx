import { Search } from 'lucide-react';
import { useJobsList } from '@/api/hooks/useJobs';
import { Container } from '@/components/layout/Container';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { EmptyState } from '@/components/feedback/EmptyState';
import { JobCard } from './JobCard';
import { JobsFilters } from './JobsFilters';
import { useJobSearch } from './useJobSearch';

export function JobsPage() {
  const search = useJobSearch();
  const query = useJobsList(search.filters);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface/50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 size-[28rem] rounded-full bg-flame-100/40 blur-3xl"
        />
        <Container className="relative py-14 sm:py-20">
          <p className="text-xs font-semibold tracking-[0.22em] text-flame-600 uppercase">
            Puna.al — Tregu shqiptar i punës
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-ink sm:text-6xl">
            Gjej punën tënde të radhës, <span className="text-flame-600">qark pas qarku.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Mundësi pune nga biznese të miratuara në të 12 qarqet e Shqipërisë. Kërko, filtro dhe
            apliko brenda pak minutash.
          </p>
        </Container>
      </section>

      <Container className="relative -mt-8 pb-16">
        <JobsFilters search={search} />

        <div className="mt-8">
          <QueryBoundary
            query={query}
            loadingFallback={
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-52 w-full rounded-card" />
                ))}
              </div>
            }
            isEmpty={(data) => data.items.length === 0}
            emptyFallback={
              <EmptyState
                icon={Search}
                title="Asnjë punë nuk u gjet"
                description="Provoni të hiqni disa filtra ose të kërkoni me fjalë të tjera kyçe."
              />
            }
          >
            {(data) => (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span>
                    <span className="font-semibold text-ink">{data.total}</span>{' '}
                    {data.total === 1 ? 'punë' : 'punë'}
                  </span>
                  {query.isFetching && <Spinner className="size-4 text-flame-600" />}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.items.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Pagination
                  page={data.page}
                  perPage={data.per_page}
                  total={data.total}
                  onPageChange={search.setPage}
                />
              </div>
            )}
          </QueryBoundary>
        </div>
      </Container>
    </>
  );
}
