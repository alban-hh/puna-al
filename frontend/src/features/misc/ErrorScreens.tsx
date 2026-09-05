import { Compass, Lock } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ButtonLink } from '@/components/ui/ButtonLink';

interface StatusScreenProps {
  code: string;
  title: string;
  description: string;
  icon: typeof Compass;
  to?: string;
  actionLabel?: string;
}

function StatusScreen({
  code,
  title,
  description,
  icon: Icon,
  to = '/',
  actionLabel = 'Kthehu te puna',
}: StatusScreenProps) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-ink text-paper">
        <Icon className="size-8" strokeWidth={1.5} />
      </span>
      <p className="font-mono text-sm tracking-widest text-flame-600">{code}</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{description}</p>
      <ButtonLink to={to} className="mt-7">
        {actionLabel}
      </ButtonLink>
    </Container>
  );
}

export function NotFoundPage() {
  return (
    <StatusScreen
      code="404"
      title="Faqja nuk u gjet"
      description="Adresa që kërkuat nuk ekziston ose është hequr. Kontrolloni linkun ose kthehuni te kërkimi i punëve."
      icon={Compass}
    />
  );
}

export function AccessDeniedPage() {
  return (
    <StatusScreen
      code="403"
      title="Akses i ndaluar"
      description="Nuk keni leje për të parë këtë faqe. Kjo zonë është vetëm për administratorët."
      icon={Lock}
    />
  );
}
