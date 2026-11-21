'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageProvider';
import { useSession } from '@/hooks/useSession';
import { useWishlistStore } from '@/store/wishlist';
import { cn, getErrorMessage } from '@/lib/utils';

/** Heart toggle; asks guests to sign in. */
export default function WishlistButton({ productId, className, withLabel = false }) {
  const t = useT();
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info(t('Sign in to save books to your wishlist'));
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const nowSaved = await toggle(productId);
      toast.success(nowSaved ? t('Saved to wishlist') : t('Removed from wishlist'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? t('Remove from wishlist') : t('Save to wishlist')}
      title={saved ? t('Remove from wishlist') : t('Save to wishlist')}
      className={cn(
        withLabel
          ? 'btn btn-secondary btn-lg'
          : 'flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-slate-200 transition hover:scale-110',
        className
      )}
    >
      <Heart className={cn('size-4', saved ? 'fill-brand-600 text-brand-600' : 'text-slate-500')} />
      {withLabel && (saved ? t('Saved') : t('Wishlist'))}
    </button>
  );
}
