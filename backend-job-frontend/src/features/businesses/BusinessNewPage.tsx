import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { isApiError } from '@/api';
import { useCreateBusiness } from '@/api/hooks/useBusinesses';
import { useToast } from '@/context/useToast';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerifiedGate } from '@/components/auth/VerifiedGate';
import { BusinessFormFields } from './BusinessFormFields';
import { createBusinessSchema, type CreateBusinessValues } from './schemas';

export function BusinessNewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createBusiness = useCreateBusiness();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateBusinessValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      nipt: '',
      description: '',
      qark: undefined,
      city: '',
      address: '',
      phone: '',
      website: '',
      logo_url: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const business = await createBusiness.mutateAsync(values);
      toast.success('Biznesi u regjistrua! Pret miratimin e administratorit.');
      navigate(`/businesses/${business.id}/jobs`);
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Regjistrimi i biznesit dështoi.');
    }
  });

  return (
    <Container className="max-w-3xl py-10">
      <Link
        to="/businesses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-flame-600"
      >
        <ArrowLeft className="size-4" />
        Bizneset e mia
      </Link>

      <PageHeader
        className="mt-6"
        eyebrow="Biznes"
        title="Regjistro një biznes"
        description="Pas regjistrimit, biznesi kalon në shqyrtim. Sapo të miratohet, mund të postoni punë."
      />

      <div className="mt-8">
        <VerifiedGate>
          <Card>
            <CardBody>
              <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
                {formError && <Alert variant="error">{formError}</Alert>}
                <Input
                  label="NIPT"
                  required
                  placeholder="K12345678L"
                  hint="10 karaktere: shkronjë, 8 shifra, shkronjë. Nuk mund të ndryshohet më vonë."
                  error={form.formState.errors.nipt?.message}
                  {...form.register('nipt')}
                />
                <BusinessFormFields register={form.register} errors={form.formState.errors} />
                <div className="flex justify-end gap-3 border-t border-line pt-5">
                  <Button variant="ghost" type="button" onClick={() => navigate('/businesses')}>
                    Anulo
                  </Button>
                  <Button type="submit" isLoading={createBusiness.isPending}>
                    Regjistro biznesin
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </VerifiedGate>
      </div>
    </Container>
  );
}
