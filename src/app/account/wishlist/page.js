'use client';

import { Heart } from 'lucide-react';
import { wishlistApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useWishlistStore } from '@/store/wishlist';
import { PageHeader } from '@/components/ui/Layout';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { ProductGrid } from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

export default function WishlistPage() {
  const savedIds = useWishlistStore((s) => s.ids);
  const { data, loading, error, reload } = useFetch(() => wishlistApi.list(), []);
  // Hide books un-saved on this page without refetching
  const products = (data?.products || []).filter((p) => savedIds.includes(p.id));

  return (
    <>
      <PageHeader title="Wishlist" description="Books you saved for later." actions={<Button variant="secondary" href="/products">Browse books</Button>} />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !loading && products.length === 0 ? (
        <div className="card">
          <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any book to save it here." action={<Button href="/products">Find books</Button>} />
        </div>
      ) : (
        <ProductGrid products={products} loading={loading} count={8} className="xl:grid-cols-5" />
      )}
    </>
  );
}
