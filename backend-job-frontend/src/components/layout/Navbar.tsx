import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Container } from './Container';
import { Logo } from './Logo';
import { Button } from '@/components/ui/Button';

interface NavTarget {
  to: string;
  label: string;
  icon: typeof Briefcase;
  end?: boolean;
}

export function Navbar() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const primaryLinks: NavTarget[] = [{ to: '/', label: 'Punë', icon: Briefcase, end: true }];
  if (isAuthenticated) {
    primaryLinks.push(
      { to: '/businesses', label: 'Bizneset e mia', icon: Building2 },
      { to: '/account/applications', label: 'Aplikimet', icon: FileText },
    );
  }
  if (isAdmin) {
    primaryLinks.push({ to: '/admin', label: 'Admin', icon: ShieldCheck });
  }

  const handleLogout = async () => {
    await logout();
    toast.success('Dolët nga llogaria.');
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-surface-sunken text-ink' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="h-0.5 w-full bg-gradient-to-r from-flame-600 via-flame-500 to-gold-400" />
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="press flex items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pr-2 pl-1.5 text-sm font-medium text-ink hover:border-line-strong"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-ink text-xs font-semibold text-paper">
                  {initials(user.full_name)}
                </span>
                <span className="max-w-32 truncate">{user.full_name}</span>
                <ChevronDown className={cn('size-4 text-muted transition-transform', menuOpen && 'rotate-180')} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="animate-rise absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{user.full_name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <MenuLink to="/account/profile" icon={UserIcon} label="Profili im" />
                    <MenuLink to="/businesses" icon={LayoutDashboard} label="Bizneset e mia" />
                    <MenuLink to="/account/applications" icon={FileText} label="Aplikimet e mia" />
                    {isAdmin && <MenuLink to="/admin" icon={ShieldCheck} label="Paneli admin" />}
                  </div>
                  <div className="border-t border-line p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-flame-700 hover:bg-flame-50"
                    >
                      <LogOut className="size-4" />
                      Dil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Hyr
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Regjistrohu
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="press rounded-lg p-2 text-ink md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Mbyll menynë' : 'Hap menynë'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-6" /> : <MenuIcon className="size-6" />}
        </button>
      </Container>

      {mobileOpen && (
        <div className="animate-fade border-t border-line bg-paper md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-surface-sunken text-ink' : 'text-ink-soft',
                  )
                }
              >
                <link.icon className="size-4" />
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 border-t border-line pt-3">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-1">
                  <NavLink
                    to="/account/profile"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft"
                  >
                    <UserIcon className="size-4" />
                    Profili im
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-flame-700"
                  >
                    <LogOut className="size-4" />
                    Dil
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-1">
                  <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>
                    Hyr
                  </Button>
                  <Button fullWidth onClick={() => navigate('/register')}>
                    Regjistrohu
                  </Button>
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, icon: Icon, label }: { to: string; icon: typeof Briefcase; label: string }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken hover:text-ink"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
