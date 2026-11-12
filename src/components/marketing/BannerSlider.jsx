'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn, mediaUrl } from '@/lib/utils';

const INTERVAL = 5000;

function Slide({ banner, active }) {
  const hasText = Boolean(banner.title || banner.subtitle);
  const body = (
    <div className="relative size-full">
      <picture>
        {banner.mobile_image && <source media="(max-width: 640px)" srcSet={mediaUrl(banner.mobile_image)} />}
        <img src={mediaUrl(banner.image)} alt={banner.title || 'Banner'} className="size-full object-cover" draggable={false} />
      </picture>
      {hasText && (
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/45 via-black/15 to-transparent">
          <div className={cn('max-w-[60%] px-6 transition-all duration-700 sm:px-12', active ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')}>
            {banner.title && <h2 className="text-xl font-bold leading-tight text-white drop-shadow sm:text-4xl">{banner.title}</h2>}
            {banner.subtitle && <p className="mt-1.5 text-xs text-white/90 drop-shadow sm:mt-3 sm:text-lg">{banner.subtitle}</p>}
            {banner.button_text && banner.link_url && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-lg sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm">
                {banner.button_text} <ArrowRight className="size-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
  return banner.link_url ? (
    <Link href={banner.link_url} className="block size-full" tabIndex={active ? 0 : -1}>{body}</Link>
  ) : body;
}

/** Auto-playing home page banner carousel (managed from Admin → Banners). */
export default function BannerSlider({ banners, className }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [count, paused]);

  if (!count) return null;
  const go = (i) => setIndex((i + count) % count);
  const current = index % count;

  return (
    <section
      className={cn('group relative overflow-hidden rounded-lg bg-slate-200 aspect-[16/7] sm:aspect-[16/5]', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
    >
      <div className="flex size-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {banners.map((b, i) => (
          <div key={b.id} className="size-full shrink-0" aria-hidden={i !== current}>
            <Slide banner={b} active={i === current} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 sm:flex"
            aria-label="Previous banner"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 sm:flex"
            aria-label="Next banner"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                className={cn('h-2 rounded-full transition-all', i === current ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80')}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
