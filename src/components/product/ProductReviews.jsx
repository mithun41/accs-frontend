'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { reviewApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useSession } from '@/hooks/useSession';
import { formatDate, getErrorMessage, toList } from '@/lib/utils';
import { Avatar, StarInput, Stars } from '@/components/ui/Media';
import { Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

function ReviewForm({ productId, onSaved }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await reviewApi.create({ product: productId, rating, comment: comment.trim() });
      toast.success('Thanks for reviewing this book!');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-900">Write a review</p>
      <StarInput label="Your rating" value={rating} onChange={setRating} />
      <Textarea rows={3} className="mt-3" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did this book help you?" />
      <Button type="submit" size="sm" className="mt-3" loading={saving}>Submit review</Button>
    </form>
  );
}

export default function ProductReviews({ product, onChanged }) {
  const { user, isAuthenticated } = useSession();
  const reviews = useFetch(() => reviewApi.list(product.id), [product.id]);
  const eligibility = useFetch(() => reviewApi.eligibility(product.id), [product.id, isAuthenticated], { enabled: isAuthenticated });
  const list = toList(reviews.data);

  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, n: list.filter((r) => r.rating === star).length }));
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  const refresh = () => {
    reviews.reload();
    eligibility.reload();
    onChanged?.();
  };

  const remove = async (id) => {
    try {
      await reviewApi.remove(id);
      toast.success('Review removed');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const reason = eligibility.data?.reason;

  return (
    <section className="card mt-8">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-900">Ratings & reviews</h2>
      </div>
      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-bold text-slate-900">{avg.toFixed(1)}</p>
            <div className="pb-1">
              <Stars value={avg} />
              <p className="text-sm text-slate-500">{list.length} review{list.length !== 1 && 's'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {counts.map(({ star, n }) => (
              <div key={star} className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${list.length ? (n / list.length) * 100 : 0}%` }} />
                </div>
                <span className="w-5 text-right">{n}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 text-sm">
            {!isAuthenticated ? (
              <p className="text-slate-500"><Link href={`/login?next=/products/${product.id}`} className="link">Sign in</Link> to review this book.</p>
            ) : reason === 'not_purchased' ? (
              <p className="text-slate-500">Only buyers who ordered this book can review it.</p>
            ) : reason === 'already_reviewed' ? (
              <p className="text-slate-500">You have reviewed this book. Thank you!</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {eligibility.data?.can_review && <ReviewForm productId={product.id} onSaved={refresh} />}
          {list.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to share how this book helped you." className="py-8" />
          ) : (
            list.map((r) => (
              <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar name={r.user_name} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{r.user_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.created_at)}</p>
                  </div>
                  <Stars value={r.rating} size="size-3.5" />
                  {user?.id === r.user && (
                    <button onClick={() => remove(r.id)} className="btn btn-ghost btn-icon h-8 w-8 text-slate-400 hover:text-red-600" aria-label="Delete review">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
