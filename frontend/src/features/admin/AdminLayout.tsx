import { NavLink, Outlet } from 'react-router-dom';
import { Briefcase, Building2, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

const tabs = [
  { to: '/admin', label: 'Përmbledhje', icon: LayoutDashboard, end: true },
  { to: '/admin/businesses', label: 'Bizneset', icon: Building2, end: false },
  { to: '/admin/users', label: 'Përdoruesit', icon: Users, end: false },
  { to: '/admin/jobs', label: 'Punët', icon: Briefcase, end: false },
];

export function AdminLayout() {
  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Administrim"
        title="Paneli i administratorit"
        description="Moderoni platformën Puna.al."
      />

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-line">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'press -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium',
                isActive
                  ? 'border-flame-600 text-flame-700'
                  : 'border-transparent text-ink-soft hover:text-ink',
              )
            }
          >
            <tab.icon className="size-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </Container>
  );
}
