'use client';

import { usePathname } from 'next/navigation';
import { Store, Ban } from 'lucide-react';
import AppDashboard from '@/components/layout/AppDashboard';
import { shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useSession } from '@/hooks/useSession';
import { PageLoader, EmptyState, Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import { VendorContext } from '@/components/vendor/VendorContext';

function VendorContent({ shop, loading, children }) {
  const pathname = usePathname();
  if (loading) return <PageLoader />;
  if (!shop && pathname !== '/vendor/shop') {
    return (
      <div className="card">
        <EmptyState
          icon={Store}
          title="Set up your shop to start selling"
          description="Create your shop profile with your business details and pickup address. It only takes a minute."
          action={<Button href="/vendor/shop">Create my shop</Button>}
        />
      </div>
    );
  }
  return (
    <>
      {shop?.is_blocked && (
        <Alert tone="error" icon={Ban} title="Your shop is temporarily blocked" className="mb-6">
          Your wallet balance is below the allowed credit limit, so your products are hidden from the marketplace. Please clear your dues with ACCS to reactivate.
        </Alert>
      )}
      {children}
    </>
  );
}

export default function VendorLayout({ children }) {
  const { isVendor, hydrated } = useSession();
  const { data, loading, reload, status } = useFetch(() => shopApi.myShop(), [], { enabled: hydrated && isVendor });
  const shop = status === 404 ? null : data?.shop_details || null;

  return (
    <VendorContext.Provider value={{ shop, reloadShop: reload }}>
      <AppDashboard
        headerExtra={
          shop ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Shop:</span>
              <span className="font-semibold text-slate-900">{shop.shop_name}</span>
            </div>
          ) : null
        }
      >
        <VendorContent shop={shop} loading={loading}>{children}</VendorContent>
      </AppDashboard>
    </VendorContext.Provider>
  );
}
