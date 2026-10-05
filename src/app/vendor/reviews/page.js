'use client';

import { MessageSquare } from 'lucide-react';
import { shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useVendor } from '@/components/vendor/VendorContext';
import { formatDate, toList } from '@/lib/utils';
import { PageHeader, Section } from '@/components/ui/Layout';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Avatar, Stars } from '@/components/ui/Media';

const CRITERIA = [
  ['product_rating', 'Product quality'],
  ['price_rating', 'Price & value'],
  ['on_time_delivery_rating', 'On-time delivery'],
  ['response_and_behavior_rating', 'Response & behaviour'],
];

export default function VendorReviewsPage() {
  const { shop } = useVendor();
  const { data, loading } = useFetch(() => shopApi.reviews({ shop_id: shop.id, page_size: 100 }), [shop.id]);
  const reviews = toList(data);

  if (loading) return <PageLoader />;

  const avg = (key) => (reviews.length ? reviews.reduce((s, r) => s + Number(r[key]), 0) / reviews.length : 0);

  return (
    <>
      <PageHeader title="Reviews" description="What buyers say about your shop." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Section title="Rating breakdown" className="h-fit">
          <div className="text-center">
            <p className="text-5xl font-semibold text-slate-900">{Number(shop.average_rating || 0).toFixed(1)}</p>
            <Stars value={shop.average_rating} className="mt-2 justify-center" />
            <p className="mt-1 text-sm text-slate-500">{shop.total_reviews} reviews</p>
          </div>
          <div className="mt-6 space-y-3">
            {CRITERIA.map(([key, label]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{label}</span><span className="font-medium">{avg(key).toFixed(1)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(avg(key) / 5) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Section>
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="card"><EmptyState icon={MessageSquare} title="No reviews yet" description="Reviews from buyers will show up here." /></div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={r.reviewer_name || r.reviewer_phone} className="size-10" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{r.reviewer_name || 'Buyer'}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.created_at)}</p>
                  </div>
                  <Stars value={r.average_rating} size="size-4" showValue />
                </div>
                {r.comment && <p className="mt-3 text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
