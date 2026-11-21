'use client';

import { PageHeader } from '@/components/ui/Layout';
import ProductForm from '@/components/vendor/ProductForm';

export default function AdminNewProductPage() {
  return (
    <>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        title="Add a book"
        description="Add a book on behalf of any shop. It is approved and goes live straight away."
      />
      <ProductForm admin backHref="/admin/products" createdHref={(p) => `/admin/products?tab=${p.approval_status || 'APPROVED'}`} />
    </>
  );
}
