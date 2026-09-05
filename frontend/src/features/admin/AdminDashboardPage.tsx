import { type ComponentType } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  type LucideProps,
  SendHorizontal,
  UserX,
  Users,
} from 'lucide-react';
import type { AdminStats } from '@/api';
import { useAdminStats } from '@/api/hooks/useAdmin';
import { formatNumber } from '@/lib/format';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { type BadgeTone } from '@/components/ui/Badge';

interface StatDef {
  key: keyof AdminStats;
  label: string;
  icon: ComponentType<LucideProps>;
  tone: BadgeTone;
}

const stats: StatDef[] = [
  { key: 'total_users', label: 'Përdorues gjithsej', icon: Users, tone: 'neutral' },
  { key: 'suspended_users', label: 'Përdorues të pezulluar', icon: UserX, tone: 'flame' },
  { key: 'total_businesses', label: 'Biznese gjithsej', icon: Building2, tone: 'neutral' },
  { key: 'pending_businesses', label: 'Biznese në pritje', icon: Clock, tone: 'amber' },
  { key: 'approved_businesses', label: 'Biznese të miratuara', icon: CheckCircle2, tone: 'pine' },
  { key: 'total_jobs', label: 'Punë gjithsej', icon: Briefcase, tone: 'neutral' },
  { key: 'published_jobs', label: 'Punë të publikuara', icon: SendHorizontal, tone: 'pine' },
  { key: 'total_applications', label: 'Aplikime gjithsej', icon: FileText, tone: 'gold' },
];

const toneAccent: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-soft',
  flame: 'bg-flame-50 text-flame-600',
  gold: 'bg-gold-100 text-gold-600',
  pine: 'bg-pine-100 text-pine-600',
  amber: 'bg-amber-soft text-amber-ink',
  slate: 'bg-slate-soft text-slate-ink',
};

export function AdminDashboardPage() {
  const query = useAdminStats();

  return (
    <QueryBoundary
      query={query}
      loadingFallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-card" />
          ))}
        </div>
      }
    >
      {(data) => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.key}>
              <CardBody className="flex items-center gap-4">
                <span
                  className={`flex size-12 items-center justify-center rounded-xl ${toneAccent[stat.tone]}`}
                >
                  <stat.icon className="size-6" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display text-3xl text-ink">{formatNumber(data[stat.key])}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </QueryBoundary>
  );
}
