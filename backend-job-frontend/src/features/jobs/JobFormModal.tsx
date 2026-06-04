import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SALARY_PERIODS, isApiError, type Job } from '@/api';
import { useCreateJob, useUpdateJob } from '@/api/hooks/useJobs';
import { useToast } from '@/context/useToast';
import { salaryPeriodLabels } from '@/lib/labels';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { CategorySelect, EmploymentTypeSelect, QarkSelect } from '@/components/forms/MetaSelects';
import { isoToLocalInput, jobSchema, jobValuesToPayload, type JobFormValues } from './jobSchema';

interface JobFormModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  job?: Job;
}

export function JobFormModal({ open, onClose, businessId, job }: JobFormModalProps) {
  const isEdit = Boolean(job);
  const toast = useToast();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob(job?.id ?? '');
  const mutation = isEdit ? updateJob : createJob;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: job
      ? {
          title: job.title,
          description: job.description,
          category: job.category,
          employment_type: job.employment_type,
          qark: job.qark,
          city: job.city,
          remote: job.remote,
          salary_min: job.salary_min ?? undefined,
          salary_max: job.salary_max ?? undefined,
          salary_period: job.salary_period ?? undefined,
          expires_at: isoToLocalInput(job.expires_at),
        }
      : { title: '', description: '', category: '', city: '', remote: false },
  });

  const close = () => {
    mutation.reset();
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = jobValuesToPayload(values);
    try {
      if (job) {
        await updateJob.mutateAsync(payload);
        toast.success('Puna u përditësua.');
      } else {
        await createJob.mutateAsync({ business_id: businessId, ...payload });
        toast.success('Puna u krijua si draft. Publikojeni kur të jeni gati.');
      }
      reset();
      onClose();
    } catch {}
  });

  return (
    <Modal
      open={open}
      onClose={close}
      className="max-w-2xl"
      title={isEdit ? 'Modifiko punën' : 'Posto një punë të re'}
      description={
        isEdit ? job?.title : 'Plotësoni detajet. Puna ruhet si draft derisa ta publikoni.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={mutation.isPending}>
            Anulo
          </Button>
          <Button type="submit" form="job-form" isLoading={mutation.isPending}>
            {isEdit ? 'Ruaj ndryshimet' : 'Krijo draftin'}
          </Button>
        </>
      }
    >
      <form
        id="job-form"
        onSubmit={onSubmit}
        className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1"
        noValidate
      >
        {mutation.isError && (
          <Alert variant="error">
            {isApiError(mutation.error) ? mutation.error.message : 'Ruajtja dështoi.'}
          </Alert>
        )}

        <Input label="Titulli" required error={errors.title?.message} {...register('title')} />

        <div className="grid gap-5 sm:grid-cols-2">
          <CategorySelect
            label="Kategoria"
            required
            placeholder="Zgjidhni kategorinë"
            error={errors.category?.message}
            {...register('category')}
          />
          <EmploymentTypeSelect
            label="Lloji i punësimit"
            required
            placeholder="Zgjidhni llojin"
            error={errors.employment_type?.message}
            {...register('employment_type')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <QarkSelect
            label="Qarku"
            required
            placeholder="Zgjidhni qarkun"
            error={errors.qark?.message}
            {...register('qark')}
          />
          <Input label="Qyteti" required error={errors.city?.message} {...register('city')} />
        </div>

        <Checkbox label="Punë në distancë (remote)" {...register('remote')} />

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Paga minimale"
            type="number"
            min={0}
            placeholder="ALL"
            error={errors.salary_min?.message}
            {...register('salary_min')}
          />
          <Input
            label="Paga maksimale"
            type="number"
            min={0}
            placeholder="ALL"
            error={errors.salary_max?.message}
            {...register('salary_max')}
          />
          <Select
            label="Periudha"
            error={errors.salary_period?.message}
            {...register('salary_period')}
          >
            <option value="">—</option>
            {SALARY_PERIODS.map((period) => (
              <option key={period} value={period}>
                Për {salaryPeriodLabels[period]}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Skadon më"
          type="datetime-local"
          hint="Opsionale. Nëse lihet bosh, publikimi skadon pas 30 ditësh."
          error={errors.expires_at?.message}
          {...register('expires_at')}
        />

        <Textarea
          label="Përshkrimi"
          rows={8}
          required
          hint="20–10000 karaktere."
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  );
}
