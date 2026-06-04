import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { isApiError, type Job } from '@/api';
import { usePromoteJob } from '@/api/hooks/useJobs';
import { useToast } from '@/context/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface PromoteDialogProps {
  open: boolean;
  onClose: () => void;
  job: Job;
}

export function PromoteDialog({ open, onClose, job }: PromoteDialogProps) {
  const promote = usePromoteJob();
  const toast = useToast();
  const [days, setDays] = useState(7);
  const error = days < 1 || days > 90 ? 'Numri i ditëve duhet të jetë 1–90.' : undefined;

  const submit = async () => {
    if (error) return;
    try {
      await promote.mutateAsync({ id: job.id, days });
      toast.success(`"${job.title}" u promovua për ${days} ditë.`);
      onClose();
    } catch {
      /* surfaced inline */
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Promovo punën"
      description="Punët e promovuara shfaqen të parat dhe theksohen me ngjyrë ari."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={promote.isPending}>
            Anulo
          </Button>
          <Button
            variant="gold"
            leftIcon={<Sparkles className="size-4" />}
            onClick={submit}
            isLoading={promote.isPending}
            disabled={Boolean(error)}
          >
            Promovo
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {promote.isError && (
          <Alert variant="error">
            {isApiError(promote.error) ? promote.error.message : 'Promovimi dështoi.'}
          </Alert>
        )}
        <Input
          label="Ditë promovimi"
          type="number"
          min={1}
          max={90}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          error={error}
          hint="Nga 1 deri në 90 ditë. Shtohet mbi promovimin ekzistues."
        />
      </div>
    </Modal>
  );
}
