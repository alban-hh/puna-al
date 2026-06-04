import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { isApiError, type Business } from '@/api';
import { useBusiness, useUpdateBusiness } from '@/api/hooks/useBusinesses';
import { useToast } from '@/context/useToast';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BusinessStatusBadge } from '@/components/ui/StatusBadge';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { VerifiedGate } from '@/components/auth/VerifiedGate';
import { BusinessFormFields } from './BusinessFormFields';
import { updateBusinessSchema, type UpdateBusinessValues } from './schemas';

export function BusinessEditPage() {
  const { id } = useParams<{ id: string }>();
  const query = useBusiness(id);

  return (
    <Container className="max-w-3xl py-10">
      <Link
        to="/businesses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-flame-600"
      >
        <ArrowLeft className="size-4" />
        Bizneset e mia
      </Link>

      <div className="mt-6">
        <QueryBoundary
          query={query}
          errorTitle="Biznesi nuk u gjet"
          loadingFallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-96 w-full rounded-card" />
            </div>
          }
        >
          {(business) => <BusinessEditForm business={business} />}
        </QueryBoundary>
      </div>
    </Container>
  );
}

function BusinessEditForm({ business }: { business: Business }) {
  const navigate = useNavigate();
  const toast = useToast();
  const updateBusiness = useUpdateBusiness(business.id);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<UpdateBusinessValues>({
    resolver: zodResolver(updateBusinessSchema),
    values: {
      name: business.name,
      description: business.description,
      qark: business.qark,
      city: business.city,
      address: business.address,
      phone: business.phone,
      website: business.website ?? '',
      logo_url: business.logo_url ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateBusiness.mutateAsync(values);
      toast.success('Biznesi u përditësua.');
      navigate('/businesses');
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Përditësimi dështoi.');
    }
  });

  return (
    <>
      <PageHeader
        eyebrow="Biznes"
        title={business.name}
        description="Përditësoni të dhënat e biznesit tuaj."
        actions={<BusinessStatusBadge status={business.status} />}
      />

      {business.status === 'rejected' && business.rejection_reason && (
        <Alert className="mt-6" variant="warning" title="Biznesi u refuzua">
          <p>{business.rejection_reason}</p>
          <p className="mt-1">Ndryshimi i të dhënave e ridërgon biznesin për shqyrtim.</p>
        </Alert>
      )}

      <Card className="mt-6">
        <CardBody>
          <VerifiedGate>
            <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
              {formError && <Alert variant="error">{formError}</Alert>}
              <Input
                label="NIPT"
                value={business.nipt}
                disabled
                hint="NIPT-i nuk mund të ndryshohet."
              />
              <BusinessFormFields register={form.register} errors={form.formState.errors} />
              <div className="flex justify-end gap-3 border-t border-line pt-5">
                <Button variant="ghost" type="button" onClick={() => navigate('/businesses')}>
                  Anulo
                </Button>
                <Button type="submit" isLoading={updateBusiness.isPending} disabled={!form.formState.isDirty}>
                  Ruaj ndryshimet
                </Button>
              </div>
            </form>
          </VerifiedGate>
        </CardBody>
      </Card>
    </>
  );
}
