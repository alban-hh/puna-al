import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isApiError } from '@/api';
import { useAuth } from '@/context/useAuth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { loginSchema, type LoginValues } from './schemas';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Hyrja dështoi. Provoni përsëri.');
    }
  });

  return (
    <AuthShell
      title="Mirë se erdhët"
      subtitle="Hyni në llogarinë tuaj Puna.al për të vazhduar."
      footer={
        <>
          Nuk keni llogari?{' '}
          <Link to="/register" className="font-semibold text-flame-600 hover:underline">
            Regjistrohuni
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ju@example.al"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            label="Fjalëkalimi"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm text-ink-soft hover:text-flame-600">
              Harruat fjalëkalimin?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Hyr
        </Button>
      </form>
    </AuthShell>
  );
}
