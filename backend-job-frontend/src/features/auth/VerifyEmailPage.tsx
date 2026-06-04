import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailOpen, XCircle } from 'lucide-react';
import { authApi, isApiError } from '@/api';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { AuthShell } from './AuthShell';
import { resendSchema, type ResendValues } from './schemas';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, refetchUser, user } = useAuth();
  const toast = useToast();

  const verify = useMutation({
    mutationFn: (verifyToken: string) => authApi.verifyEmail({ token: verifyToken }),
    onSuccess: () => {
      if (isAuthenticated) refetchUser();
    },
  });

  const attempted = useRef(false);
  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true;
      verify.mutate(token);
    }
  }, [token, verify]);

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

  if (token) {
    return (
      <AuthShell title="Verifikimi i email-it">
        {verify.isPending && (
          <div className="flex flex-col items-center gap-4 py-4 text-center text-ink-soft">
            <Spinner className="size-7 text-flame-600" />
            <p>Duke verifikuar email-in tuaj…</p>
          </div>
        )}
        {verify.isSuccess && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-pine-100 text-pine-600">
              <CheckCircle2 className="size-7" />
            </span>
            <p className="text-ink-soft">{verify.data.message}</p>
            <ButtonLink to={isAuthenticated ? '/account/profile' : '/login'} className="mt-2">
              Vazhdo
            </ButtonLink>
          </div>
        )}
        {verify.isError && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-flame-100 text-flame-600">
              <XCircle className="size-7" />
            </span>
            <p className="text-ink-soft">
              {isApiError(verify.error)
                ? verify.error.message
                : 'Linku i verifikimit është i pavlefshëm ose ka skaduar.'}
            </p>
            <p className="text-sm text-muted">Kërkoni një link të ri më poshtë.</p>
          </div>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verifikoni email-in"
      subtitle="Ju dërguam një link verifikimi. Kontrolloni kutinë tuaj postare (dhe spam-in)."
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
          Nuk e morët email-in? Shkruani adresën tuaj dhe do ta ridërgojmë.
        </p>
      </div>
      <form onSubmit={handleSubmit((values) => resend.mutate(values))} className="flex flex-col gap-4" noValidate>
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
