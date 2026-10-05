'use client';

import { PageHeader } from '@/components/ui/Layout';
import ProductForm from '@/components/vendor/ProductForm';

export default function NewProductPage() {
  return (
    <>
      <PageHeader back={{ href: '/vendor/products', label: 'Products' }} title="Add a new product" description="Fill in the details buyers need to make a decision." />
      <ProductForm />
    </>
  );
}
