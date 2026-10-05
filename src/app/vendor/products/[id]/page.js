'use client';

import { use } from 'react';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/Layout';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import ProductForm from '@/components/vendor/ProductForm';

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const { data, loading, error, reload } = useFetch(() => catalogApi.product(id), [id]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        back={{ href: '/vendor/products', label: 'Products' }}
        title={data.title}
        description="Update product details, pricing and stock."
        actions={<StatusBadge status={data.approval_status} label={data.approval_status === 'APPROVED' ? 'Live' : data.approval_status === 'PENDING' ? 'In review' : undefined} />}
      />
      <ProductForm key={data.updated_at} product={data} onSaved={reload} />
    </>
  );
}
