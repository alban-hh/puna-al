import { Link } from 'react-router-dom';
import { Container } from './Container';
import { Logo } from './Logo';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Tregu shqiptar i punës. Lidhim kandidatët me bizneset e Shqipërisë, qark pas qarku.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link to="/" className="text-ink-soft hover:text-flame-600">
            Kërko punë
          </Link>
          <Link to="/register" className="text-ink-soft hover:text-flame-600">
            Krijo llogari
          </Link>
          <Link to="/businesses/new" className="text-ink-soft hover:text-flame-600">
            Regjistro biznes
          </Link>
          <Link to="/login" className="text-ink-soft hover:text-flame-600">
            Hyr
          </Link>
        </nav>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>© {YEAR} Puna.al — Të gjitha të drejtat e rezervuara.</p>
          <p>Pagat shfaqen në Lekë (ALL).</p>
        </Container>
      </div>
    </footer>
  );
}
