'use client';

import { use, useState } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/ui/Layout';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProductForm from '@/components/vendor/ProductForm';

export default function AdminEditProductPage({ params }) {
  const { id } = use(params);
  const { data, loading, error, reload } = useFetch(() => catalogApi.product(id), [id]);
  const [approving, setApproving] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const approve = async () => {
    setApproving(true);
    try {
      await catalogApi.approveProduct(data.id);
      toast.success('Product approved and live');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        title={data.title}
        description={`Sold by ${data.shop_name || 'unknown shop'} — edit details, pricing, stock and commission.`}
        actions={
          <>
            <StatusBadge status={data.approval_status} label={data.approval_status === 'APPROVED' ? 'Live' : data.approval_status === 'PENDING' ? 'In review' : undefined} />
            {data.approval_status === 'APPROVED' ? (
              <Button variant="secondary" size="sm" href={`/products/${data.id}`} target="_blank" icon={ExternalLink}>View in store</Button>
            ) : (
              <Button size="sm" icon={CheckCircle2} loading={approving} onClick={approve}>Approve</Button>
            )}
          </>
        }
      />
      <ProductForm key={data.updated_at} admin product={data} onSaved={reload} backHref="/admin/products" />
    </>
  );
}
