import { Link } from 'react-router-dom';
import { Banknote, Clock, MapPin, Sparkles, Wifi } from 'lucide-react';
import type { Job } from '@/api';
import { cn } from '@/lib/cn';
import { formatRelative, formatSalaryForJob } from '@/lib/format';
import { employmentTypeLabels } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className={cn(
        'press group relative block overflow-hidden rounded-card border bg-surface p-5 shadow-card hover:shadow-lift sm:p-6',
        job.featured ? 'border-gold-200 ring-1 ring-gold-200' : 'border-line',
      )}
    >
      {job.featured && (
        <span className="absolute top-0 right-0 flex items-center gap-1 rounded-bl-lg bg-gold-500 px-2.5 py-1 text-xs font-semibold text-white">
          <Sparkles className="size-3.5" />
          I promovuar
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="flame">{job.category_label}</Badge>
        <Badge tone="neutral">{employmentTypeLabels[job.employment_type]}</Badge>
        {job.remote && (
          <Badge tone="pine">
            <Wifi className="size-3.5" /> Në distancë
          </Badge>
        )}
      </div>

      <h3 className="mt-3 font-display text-xl text-ink group-hover:text-flame-700">{job.title}</h3>

      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{job.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted">
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
    </Link>
  );
}
