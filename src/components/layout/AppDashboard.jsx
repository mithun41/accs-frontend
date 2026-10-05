'use client';

import { usePathname } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import RequireAuth from './RequireAuth';
import DashboardShell from './DashboardShell';
import { useSession } from '@/hooks/useSession';
import { canOpen, dashboardHome, navFor } from '@/lib/navigation';
import { humanize, roleOf } from '@/lib/utils';
import { EmptyState } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

function roleLabel(user) {
  if (user?.is_superuser) return 'Superadmin';
  if (user?.is_staff) return 'Staff';
  return humanize(roleOf(user) || 'Customer');
}

function Dashboard({ children, headerExtra }) {
  const pathname = usePathname();
  const { user } = useSession();
  const allowed = canOpen(user, pathname);

  return (
    <DashboardShell sections={navFor(user)} roleLabel={roleLabel(user)} headerExtra={allowed ? headerExtra : null}>
      {allowed ? (
        children
      ) : (
        <div className="card">
          <EmptyState
            icon={ShieldOff}
            title="You don't have access to this page"
            description="Ask an administrator to grant your role the required permission."
            action={<Button href={dashboardHome(user)}>Go to my dashboard</Button>}
          />
        </div>
      )}
    </DashboardShell>
  );
}

/** The single dashboard used by customers, sellers, staff and admins. */
export default function AppDashboard({ children, headerExtra, loginPath = '/login' }) {
  return (
    <RequireAuth loginPath={loginPath}>
      <Dashboard headerExtra={headerExtra}>{children}</Dashboard>
    </RequireAuth>
  );
}
