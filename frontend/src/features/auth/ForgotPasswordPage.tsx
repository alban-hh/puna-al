import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authApi, isApiError } from '@/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas';

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => authApi.forgotPassword(values),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  if (mutation.isSuccess) {
    return (
      <AuthShell
        title="Kontrolloni email-in"
        footer={
          <Link to="/login" className="font-semibold text-flame-600 hover:underline">
            Kthehu te hyrja
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-pine-100 text-pine-600">
            <MailCheck className="size-7" />
          </span>
          <p className="text-ink-soft">{mutation.data.message}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Rivendos fjalëkalimin"
      subtitle="Shkruani email-in dhe do t'ju dërgojmë një link rivendosjeje."
      footer={
        <Link to="/login" className="font-semibold text-flame-600 hover:underline">
          Kthehu te hyrja
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {mutation.isError && (
          <Alert variant="error">
            {isApiError(mutation.error) ? mutation.error.message : 'Diçka shkoi keq.'}
          </Alert>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ju@example.al"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" fullWidth isLoading={mutation.isPending}>
          Dërgo linkun
        </Button>
      </form>
    </AuthShell>
  );
}
