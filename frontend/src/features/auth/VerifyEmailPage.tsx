import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MailOpen } from 'lucide-react';
import { authApi, isApiError } from '@/api';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { resendSchema, type ResendValues } from './schemas';

export function VerifyEmailPage() {
  const { user } = useAuth();
  const toast = useToast();

  const resend = useMutation({
    mutationFn: (values: ResendValues) => authApi.resendVerification(values),
    onSuccess: (response) => toast.success(response.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: user?.email ?? '' },
  });

  return (
    <AuthShell
      title="Verifikoni email-in"
      subtitle="Ju dërguam një link verifikimi. Hapeni email-in dhe klikoni linkun për të aktivizuar llogarinë."
      footer={
        <Link to="/login" className="font-semibold text-flame-600 hover:underline">
          Kthehu te hyrja
        </Link>
      }
    >
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-flame-50 text-flame-600">
          <MailOpen className="size-7" />
        </span>
        <p className="text-sm text-ink-soft">
          Linku hap një faqe konfirmimi. Nuk e morët email-in? Shkruani adresën dhe do ta
          ridërgojmë.
        </p>
      </div>
      <form
        onSubmit={handleSubmit((values) => resend.mutate(values))}
        className="flex flex-col gap-4"
        noValidate
      >
        {resend.isError && (
          <Alert variant="error">
            {isApiError(resend.error) ? resend.error.message : 'Dërgimi dështoi.'}
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
        <Button type="submit" fullWidth isLoading={resend.isPending}>
          Ridërgo email-in e verifikimit
        </Button>
      </form>
    </AuthShell>
  );
}
