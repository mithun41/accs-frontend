'use client';

import { usePathname } from 'next/navigation';
import AppDashboard from '@/components/layout/AppDashboard';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return children;
  return <AppDashboard loginPath="/admin/login">{children}</AppDashboard>;
}
