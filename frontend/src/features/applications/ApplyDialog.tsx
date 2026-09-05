import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@/api';
import { useApplyToJob } from '@/api/hooks/useApplications';
import { useToast } from '@/context/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { applicationSchema, type ApplicationValues } from './schemas';

interface ApplyDialogProps {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export function ApplyDialog({ jobId, jobTitle, open, onClose, onApplied }: ApplyDialogProps) {
  const toast = useToast();
  const apply = useApplyToJob(jobId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { cover_letter: '', cv_url: '' },
  });

  const close = () => {
    apply.reset();
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apply.mutateAsync({ cover_letter: values.cover_letter, cv_url: values.cv_url });
      toast.success('Aplikimi u dërgua me sukses!');
      reset();
      apply.reset();
      onApplied();
    } catch {}
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Apliko për këtë punë"
      description={jobTitle}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={apply.isPending}>
            Anulo
          </Button>
          <Button type="submit" form="apply-form" isLoading={apply.isPending}>
            Dërgo aplikimin
          </Button>
        </>
      }
    >
      <form id="apply-form" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {apply.isError && (
          <Alert variant="error">
            {isApiError(apply.error) ? apply.error.message : 'Aplikimi dështoi. Provoni përsëri.'}
          </Alert>
        )}
        <Textarea
          label="Letra motivuese"
          rows={6}
          placeholder="Tregoni pse jeni kandidati i duhur…"
          hint="Opsionale. Deri në 5000 karaktere."
          error={errors.cover_letter?.message}
          {...register('cover_letter')}
        />
        <Input
          label="Lidhje CV-je (URL)"
          type="url"
          placeholder="https://…"
          hint="Opsionale. Lidhje drejt CV-së suaj (p.sh. Google Drive, Dropbox)."
          error={errors.cv_url?.message}
          {...register('cv_url')}
        />
      </form>
    </Modal>
  );
}
