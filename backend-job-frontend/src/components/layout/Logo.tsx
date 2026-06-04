import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export function Logo({ className, onClick }: LogoProps) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Puna.al — faqja kryesore"
    >
      <span className="relative flex size-9 items-center justify-center rounded-lg bg-ink text-paper">
        <span className="font-display text-lg leading-none font-semibold text-flame-400">P</span>
        <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-400" />
      </span>
      <span className="font-display text-xl leading-none font-semibold tracking-tight text-ink">
        Puna<span className="text-flame-600">.al</span>
      </span>
    </Link>
  );
}
