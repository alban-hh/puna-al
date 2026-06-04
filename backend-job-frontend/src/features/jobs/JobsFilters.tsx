import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { JOB_SORTS } from '@/api';
import { jobSortLabels } from '@/lib/labels';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardBody } from '@/components/ui/Card';
import { CategorySelect, EmploymentTypeSelect, QarkSelect } from '@/components/forms/MetaSelects';
import { controlBase, controlBorder } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { useJobSearch } from './useJobSearch';

interface JobsFiltersProps {
  search: ReturnType<typeof useJobSearch>;
}

export function JobsFilters({ search }: JobsFiltersProps) {
  const { searchParams, setParam, clear, activeFilterCount } = search;

  const [qInput, setQInput] = useState(searchParams.get('q') ?? '');
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const handle = setTimeout(() => setParam('q', qInput.trim() || undefined), 350);
    return () => clearTimeout(handle);
  }, [qInput, setParam]);

  const handleClear = () => {
    clear();
    setQInput('');
  };

  const sortValue = searchParams.get('sort') ?? 'newest';

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            placeholder="Kërko për tituj, fjalë kyçe…"
            aria-label="Kërko punë"
            className={cn(controlBase, controlBorder(false), 'h-12 pl-11 text-base')}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CategorySelect
            aria-label="Kategoria"
            placeholder="Të gjitha kategoritë"
            value={searchParams.get('category') ?? ''}
            onChange={(event) => setParam('category', event.target.value || undefined)}
          />
          <QarkSelect
            aria-label="Qarku"
            placeholder="Të gjithë qarqet"
            value={searchParams.get('qark') ?? ''}
            onChange={(event) => setParam('qark', event.target.value || undefined)}
          />
          <EmploymentTypeSelect
            aria-label="Lloji i punësimit"
            placeholder="Çdo lloj punësimi"
            value={searchParams.get('employment_type') ?? ''}
            onChange={(event) => setParam('employment_type', event.target.value || undefined)}
          />
          <Select
            aria-label="Renditja"
            value={sortValue}
            onChange={(event) =>
              setParam('sort', event.target.value === 'newest' ? undefined : event.target.value)
            }
          >
            {JOB_SORTS.map((value) => (
              <option key={value} value={value}>
                {jobSortLabels[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-5">
            <Checkbox
              label="Vetëm në distancë"
              checked={searchParams.get('remote') === 'true'}
              onChange={(event) => setParam('remote', event.target.checked)}
            />
            <Checkbox
              label="Vetëm të promovuara"
              checked={searchParams.get('featured') === 'true'}
              onChange={(event) => setParam('featured', event.target.checked)}
            />
          </div>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="press inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-flame-700 hover:bg-flame-50"
            >
              <X className="size-4" />
              Pastro filtrat ({activeFilterCount})
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <SlidersHorizontal className="size-4" />
              Filtro rezultatet
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
