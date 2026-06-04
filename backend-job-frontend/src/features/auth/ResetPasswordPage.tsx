import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, isApiError } from '@/api';
import { useToast } from '@/context/useToast';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { resetPasswordSchema, type ResetPasswordValues } from './schemas';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) =>
      authApi.resetPassword({ token: token as string, password: values.password }),
    onSuccess: (response) => {
      toast.success(response.message);
      navigate('/login', { replace: true });
    },
  });

  if (!token) {
    return (
      <AuthShell
        title="Link i pavlefshëm"
        footer={
          <Link to="/forgot-password" className="font-semibold text-flame-600 hover:underline">
            Kërko një link të ri
          </Link>
        }
      >
        <Alert variant="error">
          Linku i rivendosjes mungon ose është i dëmtuar. Kërkoni një link të ri për të vazhduar.
        </Alert>
      </AuthShell>
    );
  }

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <AuthShell title="Vendos fjalëkalim të ri" subtitle="Zgjidhni një fjalëkalim të ri për llogarinë tuaj.">
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {mutation.isError && (
          <Alert variant="error">
            {isApiError(mutation.error) ? mutation.error.message : 'Rivendosja dështoi.'}
          </Alert>
        )}
        <Input
          label="Fjalëkalimi i ri"
          type="password"
          autoComplete="new-password"
          required
          hint="8–128 karaktere."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Konfirmo fjalëkalimin"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" size="lg" fullWidth isLoading={mutation.isPending}>
          Rivendos fjalëkalimin
        </Button>
      </form>
    </AuthShell>
  );
}
