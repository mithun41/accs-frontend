'use client';

import { Heart } from 'lucide-react';
import { wishlistApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useWishlistStore } from '@/store/wishlist';
import { PageHeader } from '@/components/ui/Layout';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { ProductGrid } from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/LanguageProvider';

export default function WishlistPage() {
  const t = useT();
  const savedIds = useWishlistStore((s) => s.ids);
  const { data, loading, error, reload } = useFetch(() => wishlistApi.list(), []);
  // Hide books un-saved on this page without refetching
  const products = (data?.products || []).filter((p) => savedIds.includes(p.id));

  return (
    <>
      <PageHeader title={t('Wishlist')} description={t('Books you saved for later.')} actions={<Button variant="secondary" href="/products">{t('Browse books')}</Button>} />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !loading && products.length === 0 ? (
        <div className="card">
          <EmptyState icon={Heart} title={t('Your wishlist is empty')} description={t('Tap the heart on any book to save it here.')} action={<Button href="/products">{t('Find books')}</Button>} />
        </div>
      ) : (
        <ProductGrid products={products} loading={loading} count={8} className="xl:grid-cols-5" />
      )}
    </>
  );
}
