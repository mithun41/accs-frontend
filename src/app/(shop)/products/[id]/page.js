'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShoppingCart, Zap, Store, MapPin, ShieldCheck, Truck, RotateCcw, Package, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, mediaUrl, toList } from '@/lib/utils';
import { PriceTag, ProductGrid, useAddToCart } from '@/components/product/ProductCard';
import { ShopLogo, Stars, Thumb } from '@/components/ui/Media';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
              <img src={mediaUrl(img.image)} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Thumb src={current?.image} alt={product.title} seed={product.id} rounded="rounded-none" className="size-full" />
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, loading, error, reload, status } = useFetch(() => catalogApi.product(id), [id]);
  const { addToCart, pendingId } = useAddToCart();
  const [chosenQty, setQty] = useState(null);
  const qty = chosenQty ?? Math.max(1, product?.moq || 1);

  const categoryId = product?.category;
  const related = useFetch(
    () => catalogApi.products({ category: categoryId, page_size: 5 }),
    [categoryId],
    { enabled: Boolean(categoryId) }
  );
  const relatedProducts = toList(related.data).filter((p) => String(p.id) !== String(id)).slice(0, 4);

  if (loading) return <PageLoader />;
  if (error || !product) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message={status === 404 ? 'This product is not available anymore.' : error}
          onRetry={status === 404 ? undefined : reload}
        />
        <div className="text-center"><Button variant="secondary" href="/products">Browse products</Button></div>
      </div>
    );
  }

  const shop = product.shop_details;
  const category = product.category_details;
  const stock = Number(product.stock_quantity);
  const outOfStock = stock <= 0;
  const moq = product.moq || 1;
  const hasDiscount = product.after_discount_price !== null && product.after_discount_price !== undefined;

  const handleBuyNow = async () => {
    const ok = await addToCart(product, qty);
    if (ok) router.push('/cart');
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-slate-800">Products</Link>
        {category?.parent && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${category.parent}`} className="hover:text-slate-800">{category.parent_name}</Link>
          </>
        )}
        {category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${category.id}`} className="hover:text-slate-800">{category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery product={product} />

        <div>
          {category && <Badge tone="brand">{category.name}</Badge>}
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{product.title}</h1>

          {shop && (
            <Link href={`/shops/${shop.id}`} className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700">
              <Store className="size-4" /> {shop.shop_name}
              <span className="text-slate-300">·</span>
              <Stars value={shop.average_rating} size="size-3.5" />
              <span className="text-slate-500">({shop.total_reviews})</span>
            </Link>
          )}

          <div className="mt-6 rounded-xl bg-slate-50 p-5 border border-slate-100">
            <PriceTag product={product} size="lg" />
            {hasDiscount && product.discount_end_date && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                <Clock className="size-4" /> Offer ends {formatDate(product.discount_end_date)}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {outOfStock ? (
                <span className="flex items-center gap-1.5 font-medium text-red-600"><AlertTriangle className="size-4" /> Out of stock</span>
              ) : product.is_low_stock ? (
                <span className="flex items-center gap-1.5 font-medium text-amber-600"><AlertTriangle className="size-4" /> Only {stock} left</span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600"><CheckCircle2 className="size-4" /> In stock ({stock} available)</span>
              )}
              {product.size && <span className="text-slate-600">Size: <strong className="text-slate-900">{product.size}</strong></span>}
              {moq > 1 && <span className="text-slate-600">Minimum order: <strong className="text-slate-900">{moq} pcs</strong></span>}
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
              Add to cart
            </Button>
            <Button size="lg" icon={Zap} className="flex-1 min-w-40" disabled={outOfStock} onClick={handleBuyNow}>
              Buy now
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { icon: Truck, t: 'Pathao delivery', s: 'Inside Dhaka 1–2 days' },
              { icon: ShieldCheck, t: 'Cash on delivery', s: 'Pay at your door' },
              { icon: RotateCcw, t: 'Easy returns', s: 'See return policy' },
            ].map(({ icon: Icon, t, s }) => (
              <div key={t} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <Icon className="size-5 text-brand-600 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">{t}</p>
                  <p className="text-xs text-slate-500">{s}</p>
                </div>
              </div>
            ))}
          </div>

          {shop && (
            <div className="mt-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <ShopLogo src={shop.logo} name={shop.shop_name} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{shop.shop_name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500 truncate">
                  <MapPin className="size-3.5" /> {shop.city?.name || shop.shop_address}
                  <span className="mx-1">·</span>
                  {shop.shop_type === 'WHOLESALER' ? 'Wholesaler' : 'Retailer'}
                </p>
              </div>
              <Button variant="secondary" size="sm" href={`/shops/${shop.id}`}>Visit shop</Button>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12 card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Product details</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {product.description || 'No description provided by the seller.'}
          </p>
          <dl className="space-y-3 text-sm">
            {[
              ['Category', category?.name],
              ['Size', product.size],
              ['Minimum order', `${moq} pcs`],
              ['Seller', shop?.shop_name],
              ['Listed on', formatDate(product.created_at)],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-800 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Package className="size-5 text-brand-600" /> You may also like
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
