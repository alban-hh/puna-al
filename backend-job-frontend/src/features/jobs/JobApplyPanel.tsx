import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Lock, Send } from 'lucide-react';
import type { JobDetail } from '@/api';
import { useAuth } from '@/context/useAuth';
import { useMyBusinesses } from '@/api/hooks/useBusinesses';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Alert } from '@/components/ui/Alert';
import { VerifiedGate } from '@/components/auth/VerifiedGate';
import { ApplyDialog } from '@/features/applications/ApplyDialog';

export function JobApplyPanel({ job }: { job: JobDetail }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const myBusinesses = useMyBusinesses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  if (job.status !== 'published') {
    return (
      <Alert variant="info" title="Mbyllur për aplikime">
        Kjo punë nuk pranon më aplikime të reja.
      </Alert>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">Hyni ose krijoni një llogari për të aplikuar.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink to="/login" state={{ from: location.pathname }} fullWidth leftIcon={<Lock className="size-4" />}>
            Hyr për të aplikuar
          </ButtonLink>
          <ButtonLink to="/register" variant="secondary" fullWidth>
            Regjistrohu
          </ButtonLink>
        </div>
      </div>
    );
  }

  const ownsBusiness = (myBusinesses.data ?? []).some((business) => business.id === job.business_id);
  if (ownsBusiness) {
    return (
      <Alert variant="info" title="Kjo është puna juaj">
        Nuk mund të aplikoni në një punë të biznesit tuaj. Menaxhoni aplikantët nga paneli i
        biznesit.
      </Alert>
    );
  }

  if (applied) {
    return (
      <Alert variant="success" title="Aplikimi u dërgua">
        E gjeni te <a className="font-semibold underline" href="/account/applications">Aplikimet e mia</a>.
      </Alert>
    );
  }

  return (
    <VerifiedGate>
      <div className="flex flex-col gap-3">
        <Button size="lg" fullWidth leftIcon={<Send className="size-4" />} onClick={() => setDialogOpen(true)}>
          Apliko tani
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <CheckCircle2 className="size-3.5 text-pine-600" />
          Aplikim i shpejtë me letër motivuese dhe CV
        </p>
      </div>
      <ApplyDialog
        jobId={job.id}
        jobTitle={job.title}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onApplied={() => {
          setDialogOpen(false);
          setApplied(true);
        }}
      />
    </VerifiedGate>
  );
}
