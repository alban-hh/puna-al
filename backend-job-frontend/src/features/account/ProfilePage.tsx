import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { BadgeCheck, MailWarning, ShieldCheck } from 'lucide-react';
import { authApi, isApiError } from '@/api';
import { fullNameSchema, optionalAlbanianPhone } from '@/validation/fields';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { useUpdateProfile } from '@/api/hooks/useProfile';
import { formatDate } from '@/lib/format';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const profileSchema = z.object({
  full_name: fullNameSchema,
  phone: optionalAlbanianPhone,
});
type ProfileValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, isVerified } = useAuth();
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { full_name: user?.full_name ?? '', phone: user?.phone ?? '' },
  });

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification({ email: user?.email ?? '' }),
    onSuccess: (response) => toast.success(response.message),
    onError: (error) => toast.error(isApiError(error) ? error.message : 'Dërgimi dështoi.'),
  });

  if (!user) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updateProfile.mutateAsync({
        full_name: values.full_name,
        phone: values.phone,
      });
      reset({ full_name: updated.full_name, phone: updated.phone ?? '' });
      toast.success('Profili u përditësua.');
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Përditësimi dështoi.');
    }
  });

  return (
    <Container className="py-10">
      <PageHeader eyebrow="Llogaria" title="Profili im" description="Menaxhoni të dhënat e llogarisë tuaj." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardBody className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-paper">
                {user.full_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-ink">{user.full_name}</p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
            </div>

            <dl className="flex flex-col gap-3 border-t border-line pt-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Roli</dt>
                <dd>
                  <Badge tone={user.role === 'admin' ? 'flame' : 'neutral'}>
                    {user.role === 'admin' ? (
                      <>
                        <ShieldCheck className="size-3.5" /> Administrator
                      </>
                    ) : (
                      'Përdorues'
                    )}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Email-i</dt>
                <dd>
                  {isVerified ? (
                    <Badge tone="pine">
                      <BadgeCheck className="size-3.5" /> I verifikuar
                    </Badge>
                  ) : (
                    <Badge tone="amber">I paverifikuar</Badge>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Anëtar që nga</dt>
                <dd className="font-medium text-ink">{formatDate(user.created_at)}</dd>
              </div>
            </dl>

            {!isVerified && (
              <Alert variant="warning" title="Email-i nuk është i verifikuar">
                <p>Verifikoni email-in për të postuar punë ose aplikuar.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  leftIcon={<MailWarning className="size-4" />}
                  isLoading={resend.isPending}
                  onClick={() => resend.mutate()}
                >
                  Ridërgo verifikimin
                </Button>
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-display text-xl text-ink">Përditëso të dhënat</h2>
            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5" noValidate>
              <Input
                label="Emri i plotë"
                required
                error={errors.full_name?.message}
                {...register('full_name')}
              />
              <Input
                label="Telefoni"
                type="tel"
                placeholder="+355 6X XXX XXXX"
                hint="Formati shqiptar: +355 i ndjekur nga 8–9 shifra."
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input label="Email" value={user.email} disabled hint="Email-i nuk mund të ndryshohet." />
              <div className="flex justify-end">
                <Button type="submit" isLoading={updateProfile.isPending} disabled={!isDirty}>
                  Ruaj ndryshimet
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
