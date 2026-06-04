import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function buildPageWindow(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) result.push('gap');
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({ page, perPage, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const window = buildPageWindow(page, totalPages);

  const navButton =
    'press inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-line bg-surface px-2 text-sm font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-line';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-sm text-muted">
        <span className="font-medium text-ink">
          {from}–{to}
        </span>{' '}
        nga {total}
      </p>
      <nav className="flex items-center gap-1" aria-label="Faqet">
        <button
          type="button"
          className={navButton}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Faqja e mëparshme"
        >
          <ChevronLeft className="size-4" />
        </button>
        {window.map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-muted">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                navButton,
                entry === page && 'border-ink bg-ink text-white hover:border-ink',
              )}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          className={navButton}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Faqja tjetër"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
