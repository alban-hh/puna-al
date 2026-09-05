import { type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MailWarning } from 'lucide-react';
import { authApi, isApiError } from '@/api';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export function VerifiedGate({ children }: { children: ReactNode }) {
  const { user, isVerified } = useAuth();
  const toast = useToast();

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification({ email: user?.email ?? '' }),
    onSuccess: (response) => toast.success(response.message, 'Email-i u dërgua'),
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : 'Dërgimi dështoi. Provoni përsëri.'),
  });

  if (isVerified) return <>{children}</>;

  return (
    <Card className="border-amber-soft">
      <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-soft text-amber-ink">
          <MailWarning className="size-6" />
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg text-ink">Verifikoni email-in tuaj</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Ky veprim kërkon një llogari të verifikuar. Hapni email-in te{' '}
            <span className="font-medium text-ink">{user?.email}</span> dhe ndiqni linkun e
            verifikimit. Nuk e gjeni? Mund ta ridërgojmë.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => resend.mutate()}
          isLoading={resend.isPending}
          className="shrink-0"
        >
          Ridërgo email-in
        </Button>
      </CardBody>
    </Card>
  );
}
