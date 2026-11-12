'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { useWishlistStore } from '@/store/wishlist';
import { cn, getErrorMessage } from '@/lib/utils';

/** Heart toggle; asks guests to sign in. */
export default function WishlistButton({ productId, className, withLabel = false }) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Sign in to save books to your wishlist');
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const nowSaved = await toggle(productId);
      toast.success(nowSaved ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        withLabel
          ? 'btn btn-secondary btn-lg'
          : 'flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-slate-200 transition hover:scale-110',
        className
      )}
    >
      <Heart className={cn('size-4', saved ? 'fill-brand-600 text-brand-600' : 'text-slate-500')} />
      {withLabel && (saved ? 'Saved' : 'Wishlist')}
    </button>
  );
}
