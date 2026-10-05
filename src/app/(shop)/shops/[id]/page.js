'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { MapPin, Mail, Clock, Store, MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi, shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useSession } from '@/hooks/useSession';
import { formatDate, getErrorMessage, toList, toMeta } from '@/lib/utils';
import { ShopLogo, Stars, StarInput, Thumb, Avatar } from '@/components/ui/Media';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { Pagination, Tabs } from '@/components/ui/Layout';
import { ProductGrid } from '@/components/product/ProductCard';
import { Field, Textarea } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const CRITERIA = [
  ['product_rating', 'Product quality'],
  ['price_rating', 'Price & value'],
  ['on_time_delivery_rating', 'On-time delivery'],
  ['response_and_behavior_rating', 'Response & behaviour'],
];

function ReviewModal({ open, onClose, shopId, onSaved }) {
  const [form, setForm] = useState({ product_rating: 5, price_rating: 5, on_time_delivery_rating: 5, response_and_behavior_rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await shopApi.createReview({ ...form, shop: shopId });
      toast.success('Thanks for your review!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rate this shop"
      description="Your feedback helps other buyers choose the right seller."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Submit review</Button>
        </>
      }
    >
      <div className="space-y-4">
        {CRITERIA.map(([key, label]) => (
          <StarInput key={key} label={label} value={form[key]} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
        ))}
        <Field label="Comment (optional)">
          <Textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Share your experience with this seller…" />
        </Field>
      </div>
    </Modal>
  );
}

export default function ShopDetailPage({ params }) {
  const { id } = use(params);
  const { user, isAuthenticated } = useSession();
  const [tab, setTab] = useState('products');
  const [page, setPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);

  const shopRes = useFetch(() => shopApi.shop(id), [id]);
  const productsRes = useFetch(() => catalogApi.products({ shop: id, page, page_size: 12 }), [id, page]);
  const reviewsRes = useFetch(() => shopApi.reviews({ shop_id: id, page_size: 50 }), [id]);

  if (shopRes.loading) return <PageLoader />;
  if (shopRes.error) return <div className="container-page py-16"><ErrorState message={shopRes.error} onRetry={shopRes.reload} /></div>;

  const shop = shopRes.data?.shop_details || shopRes.data;
  const owner = shopRes.data?.user_details;
  const reviews = toList(reviewsRes.data);
  const products = toList(productsRes.data);
  const isOwner = owner && user && owner.id === user.id;
  const alreadyReviewed = reviews.some((r) => r.reviewer === user?.id);

  return (
    <div>
      <div className="relative h-44 sm:h-56 bg-slate-200">
        <Thumb src={shop.banner} seed={shop.id} icon={Store} rounded="rounded-none" className="size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
      </div>
      <div className="container-page">
        <div className="relative -mt-12 card p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ShopLogo src={shop.logo} name={shop.shop_name} className="size-20 ring-4 ring-white shadow-md text-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{shop.shop_name}</h1>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                  {shop.shop_type === 'WHOLESALER' ? 'Wholesaler' : 'Retailer'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Stars value={shop.average_rating} size="size-4" />
                  <strong className="text-slate-800">{Number(shop.average_rating || 0).toFixed(1)}</strong> ({shop.total_reviews} reviews)
                </span>
                <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {shop.city?.name ? `${shop.city.name} · ` : ''}{shop.shop_address}</span>
                {shop.contact_email && <span className="flex items-center gap-1.5"><Mail className="size-4" /> {shop.contact_email}</span>}
                {shop.opening_time && shop.closing_time && (
                  <span className="flex items-center gap-1.5"><Clock className="size-4" /> {shop.opening_time.slice(0, 5)} – {shop.closing_time.slice(0, 5)}</span>
                )}
              </div>
            </div>
            {isAuthenticated && !isOwner && !alreadyReviewed && (
              <Button variant="secondary" icon={Star} onClick={() => setReviewOpen(true)}>Write a review</Button>
            )}
            {!isAuthenticated && (
              <Button variant="secondary" href={`/login?next=/shops/${id}`} icon={Star}>Sign in to review</Button>
            )}
          </div>
          {shop.description && <p className="mt-5 text-sm leading-relaxed text-slate-600 max-w-3xl">{shop.description}</p>}
        </div>

        <Tabs
          className="mt-8 mb-6"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'products', label: 'Products', count: toMeta(productsRes.data)?.count },
            { value: 'reviews', label: 'Reviews', count: reviews.length },
          ]}
        />

        {tab === 'products' ? (
          !productsRes.loading && products.length === 0 ? (
            <div className="card"><EmptyState title="No products yet" description="This shop hasn't listed any products yet." /></div>
          ) : (
            <>
              <ProductGrid products={products} loading={productsRes.loading} />
              <Pagination meta={toMeta(productsRes.data)} page={page} onPageChange={setPage} className="mt-4" />
            </>
          )
        ) : reviews.length === 0 ? (
          <div className="card"><EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to share your experience with this shop." /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={r.reviewer_name || r.reviewer_phone} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{r.reviewer_name || 'Verified buyer'}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <Stars value={r.average_rating} size="size-3.5" />
                    <p className="text-xs text-slate-500 mt-0.5">{Number(r.average_rating).toFixed(1)} / 5</p>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-sm text-slate-600">{r.comment}</p>}
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                  {CRITERIA.map(([key, label]) => (
                    <span key={key} className="flex justify-between"><span>{label}</span><strong className="text-slate-700">{r[key]}/5</strong></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} shopId={Number(id)} onSaved={() => { reviewsRes.reload(); shopRes.reload(); }} />
      <div className="container-page mt-6">
        <Link href="/shops" className="link text-sm">← Back to all shops</Link>
      </div>
    </div>
  );
}
