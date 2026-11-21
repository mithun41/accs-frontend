'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShoppingCart, Zap, ShieldCheck, Truck, RotateCcw, Package, Clock, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, mediaUrl, toList } from '@/lib/utils';
import { productKind } from '@/lib/catalog';
import { PriceTag, ProductGrid, PublisherTag, useAddToCart, useCheckoutHref } from '@/components/product/ProductCard';
import { Stars, Thumb } from '@/components/ui/Media';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import WishlistButton from '@/components/product/WishlistButton';
import ProductReviews from '@/components/product/ProductReviews';
import BookPreview from '@/components/product/BookPreview';
import { useCategoryName, useT } from '@/i18n/LanguageProvider';

function Gallery({ product }) {
  const images = [...(product.images || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                'size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white',
                i === active ? 'border-brand-500' : 'border-transparent hover:border-slate-300'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(img.image)} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex flex-1 items-center justify-center rounded-lg border border-slate-200/70 bg-white p-6 sm:p-10">
        <div className="aspect-[3/4] w-full max-w-sm">
          <Thumb src={current?.image} alt={product.title} seed={product.id} icon={BookOpen} fit="contain" rounded="rounded-md" className="size-full bg-transparent shadow-[0_12px_30px_-12px_rgb(15_23_42/0.45)]" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }) {
  const t = useT();
  const catName = useCategoryName();
  const { id } = use(params);
  const router = useRouter();
  const { data: product, loading, error, reload, status } = useFetch(() => catalogApi.product(id), [id]);
  const { addToCart, pendingId } = useAddToCart();
  const checkoutHref = useCheckoutHref();
  const [chosenQty, setQty] = useState(null);
  const qty = chosenQty ?? Math.max(1, product?.moq || 1);

  const categoryId = product?.category;
  const related = useFetch(
    () => catalogApi.products({ category: categoryId, page_size: 6 }),
    [categoryId],
    { enabled: Boolean(categoryId) }
  );
  const relatedProducts = toList(related.data).filter((p) => String(p.id) !== String(id)).slice(0, 5);

  if (loading) return <PageLoader />;
  if (error || !product) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message={status === 404 ? t('This product is not available anymore.') : error}
          onRetry={status === 404 ? undefined : reload}
        />
        <div className="text-center"><Button variant="secondary" href="/products">{t('Browse products')}</Button></div>
      </div>
    );
  }

  const category = product.category_details;
  // Books belong to a class & subject; stationery and other items to a department & type
  const kind = productKind(category);
  const stock = Number(product.stock_quantity);
  const outOfStock = stock <= 0;
  const moq = product.moq || 1;
  const hasDiscount = product.after_discount_price !== null && product.after_discount_price !== undefined;

  const handleBuyNow = async () => {
    const ok = await addToCart(product, qty);
    if (ok) router.push(checkoutHref);
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-800">{t('Home')}</Link>
        <ChevronRight className="size-3.5" />
        {kind.isBook && (
          <>
            <Link href="/products" className="hover:text-slate-800">{t('Books')}</Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        {kind.path.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5" />}
            <Link href={`/products?category=${c.id}`} className="hover:text-slate-800">{catName(c.name)}</Link>
          </span>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <Gallery product={product} />
          <BookPreview pdf={product.preview_pdf} title={product.title} />
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {kind.path.map((c, i) => <Badge key={c.id} tone={i === 0 ? 'brand' : 'gray'}>{catName(c.name)}</Badge>)}
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{product.title}</h1>
          {product.rating_count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Stars value={product.rating_avg} size="size-4" /> <strong>{Number(product.rating_avg).toFixed(1)}</strong> ({t(product.rating_count === 1 ? '1 review' : '{count} reviews', { count: product.rating_count })})
            </p>
          )}
          {(product.author || product.publisher) && (
            <div className="mt-2 space-y-0.5 text-[15px] text-slate-600">
              {product.author && (
                <p>{t('by')} <Link href={`/products?author=${encodeURIComponent(product.author)}`} className="font-medium text-brand-600 hover:underline">{product.author}</Link></p>
              )}
              {kind.isBook && product.publisher && (
                <p className="flex items-center gap-2 pt-1">{t('Publisher')}: <PublisherTag name={product.publisher} className="text-xs" /></p>
              )}
              {/* Other items show their brand */}
              {!kind.isBook && product.publisher && (
                <p>{t('Brand')}: <Link href={`/products?publisher=${encodeURIComponent(product.publisher)}`} className="font-medium text-slate-800 hover:text-brand-600 hover:underline">{product.publisher}</Link></p>
              )}
            </div>
          )}

          <div className="mt-6 rounded-xl bg-slate-50 p-5 border border-slate-100">
            <PriceTag product={product} size="lg" />
            {hasDiscount && product.discount_end_date && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-red-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="size-4" /> {t('Offer ends {date}', { date: formatDate(product.discount_end_date) })}
                </span>
                {product.discount_start_date && (
                  <span className="text-xs text-slate-500">
                    ({t('Valid from {date}', { date: formatDate(product.discount_start_date) })})
                  </span>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {outOfStock ? (
                <span className="flex items-center gap-1.5 font-medium text-red-600"><AlertTriangle className="size-4" /> {t('Out of stock')}</span>
              ) : product.is_low_stock ? (
                <span className="flex items-center gap-1.5 font-medium text-amber-600"><AlertTriangle className="size-4" /> {t('Only {count} left', { count: stock })}</span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600"><CheckCircle2 className="size-4" /> {t('In stock ({count} available)', { count: stock })}</span>
              )}
              {product.size && <span className="text-slate-600">{t(kind.isBook ? 'Edition' : 'Size')}: <strong className="text-slate-900">{product.size}</strong></span>}
              {moq > 1 && <span className="text-slate-600">{t('Minimum order')}: <strong className="text-slate-900">{t('{count} pcs', { count: moq })}</strong></span>}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} min={moq} max={Math.max(moq, stock)} disabled={outOfStock} />
            <Button
              size="lg"
              variant="secondary"
              icon={ShoppingCart}
              className="flex-1 min-w-40"
              disabled={outOfStock}
              loading={pendingId === product.id}
              onClick={() => addToCart(product, qty)}
            >
              {t('Add to cart')}
            </Button>
            <Button size="lg" icon={Zap} className="flex-1 min-w-40" disabled={outOfStock} onClick={handleBuyNow}>
              {t('Buy now')}
            </Button>
            <WishlistButton productId={product.id} withLabel />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { icon: Truck, title: 'Pathao delivery', text: 'Inside Dhaka 1–2 days' },
              { icon: ShieldCheck, title: 'Cash on delivery', text: 'Pay at your door' },
              { icon: RotateCcw, title: 'Easy returns', text: 'See return policy' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <Icon className="size-5 text-brand-600 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">{t(title)}</p>
                  <p className="text-xs text-slate-500">{t(text)}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <section className="mt-12 card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">{t(kind.isBook ? 'Book details' : 'Product details')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {product.description || t('No description yet.')}
          </p>
          <dl className="space-y-3 text-sm">
            {[
              ['Author', product.author],
              ['Brand', kind.isBook ? null : product.publisher],
              [kind.isBook ? 'Class' : 'Category', kind.root && catName(kind.root)],
              [kind.isBook ? 'Subject' : 'Type', kind.leaf && kind.path.slice(1).map((c) => catName(c.name)).join(' › ')],
              [kind.isBook ? 'Edition' : 'Size / pack', product.size],
              ['Minimum order', t('{count} pcs', { count: moq })],
              ['Listed on', formatDate(product.created_at)],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">{t(k)}</dt>
                <dd className="font-medium text-slate-800 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ProductReviews product={product} onChanged={reload} />

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Package className="size-5 text-brand-600" /> {t('You may also like')}
          </h2>
          <ProductGrid products={relatedProducts} className="xl:grid-cols-5" />
        </section>
      )}
    </div>
  );
}
