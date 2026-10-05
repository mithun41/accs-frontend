'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { PageLoader } from '@/components/ui/Feedback';

/**
 * Client-side route guard.
 * `allow(session)` can restrict by role; failing it redirects to `fallback`.
 */
export default function RequireAuth({ children, allow, loginPath = '/login', fallback = '/' }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const permitted = session.isAuthenticated && (!allow || allow(session));

  useEffect(() => {
    if (!session.hydrated) return;
    if (!session.isAuthenticated) router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
    else if (!permitted) router.replace(fallback);
  }, [session.hydrated, session.isAuthenticated, permitted, router, pathname, loginPath, fallback]);

  if (!session.hydrated || !permitted) return <PageLoader label="Checking your session…" />;
  return children;
}
