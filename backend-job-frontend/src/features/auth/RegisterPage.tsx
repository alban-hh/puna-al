import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { isApiError } from '@/api';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { registerSchema, type RegisterValues } from './schemas';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });
      toast.success('Llogaria u krijua! Kontrolloni email-in për ta verifikuar.');
      navigate('/verify-email');
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Regjistrimi dështoi. Provoni përsëri.');
    }
  });

  return (
    <AuthShell
      title="Krijoni llogari"
      subtitle="Bashkohuni me Puna.al — kandidat ose punëdhënës."
      footer={
        <>
          Keni tashmë llogari?{' '}
          <Link to="/login" className="font-semibold text-flame-600 hover:underline">
            Hyni këtu
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input
          label="Emri i plotë"
          autoComplete="name"
          placeholder="Emri Mbiemri"
          required
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ju@example.al"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Fjalëkalimi"
          type="password"
          autoComplete="new-password"
          placeholder="Të paktën 8 karaktere"
          required
          hint="8–128 karaktere."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Telefoni"
          type="tel"
          autoComplete="tel"
          placeholder="+355 6X XXX XXXX"
          hint="Opsionale. Formati shqiptar: +355 i ndjekur nga 8–9 shifra."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Regjistrohu
        </Button>
      </form>
    </AuthShell>
  );
}
