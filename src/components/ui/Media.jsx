'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Package, Star, Store, UploadCloud, X, FileText } from 'lucide-react';
import { cn, initials, mediaUrl } from '@/lib/utils';

const PLACEHOLDER_TONES = [
  'from-brand-100 to-brand-50 text-brand-500',
  'from-sky-100 to-sky-50 text-sky-500',
  'from-amber-100 to-amber-50 text-amber-500',
  'from-violet-100 to-violet-50 text-violet-500',
  'from-rose-100 to-rose-50 text-rose-500',
  'from-emerald-100 to-emerald-50 text-emerald-500',
];

/** Product / shop image with a tasteful placeholder when no image exists. */
export function Thumb({ src, alt = '', seed = 0, icon: Icon = Package, className, rounded = 'rounded-lg' }) {
  const [failed, setFailed] = useState(false);
  const url = src ? mediaUrl(src) : null;
  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} onError={() => setFailed(true)} className={cn('object-cover bg-slate-100', rounded, className)} />;
  }
  const tone = PLACEHOLDER_TONES[Math.abs(Number(seed) || 0) % PLACEHOLDER_TONES.length];
  return (
    <div className={cn('flex items-center justify-center bg-gradient-to-br', tone, rounded, className)} aria-label={alt}>
      <Icon className="size-1/3 max-w-12 max-h-12 opacity-80" strokeWidth={1.5} />
    </div>
  );
}

export function ShopLogo({ src, name, className }) {
  const [failed, setFailed] = useState(false);
  const url = src ? mediaUrl(src) : null;
  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} onError={() => setFailed(true)} className={cn('rounded-xl object-cover bg-white', className)} />;
  }
  return (
    <div className={cn('flex items-center justify-center rounded-xl bg-brand-600 text-white font-semibold', className)}>
      {name ? initials(name) : <Store className="size-5" />}
    </div>
  );
}

export function Avatar({ src, name, className }) {
  const [failed, setFailed] = useState(false);
  const url = src ? mediaUrl(src) : null;
  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} onError={() => setFailed(true)} className={cn('rounded-full object-cover', className)} />;
  }
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm', className)}>
      {initials(name)}
    </div>
  );
}

export function Stars({ value = 0, size = 'size-4', className, showValue = false }) {
  const v = Number(value) || 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(size, i <= Math.round(v) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')}
        />
      ))}
      {showValue && <span className="ml-1 text-sm font-medium text-slate-700">{v.toFixed(1)}</span>}
    </span>
  );
}

export function StarInput({ value, onChange, label }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
            aria-label={`${i} star`}
          >
            <Star
              className={cn(
                'size-6 transition-colors',
                i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Single file picker with image preview (or document name). */
export function FilePicker({ value, onChange, existingUrl, accept = 'image/*', label = 'Upload image', className, aspect = 'aspect-video' }) {
  const inputRef = useRef(null);
  const preview = useMemo(() => (value && value.type?.startsWith('image/') ? URL.createObjectURL(value) : null), [value]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const shownImage = preview || (existingUrl && accept.includes('image') ? mediaUrl(existingUrl) : null);
  const isDocument = value && !value.type?.startsWith('image/');

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50/40',
          aspect
        )}
      >
        {shownImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownImage} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </span>
          </>
        ) : isDocument || (existingUrl && !accept.includes('image')) ? (
          <span className="flex flex-col items-center gap-2 px-3 text-center">
            <FileText className="size-7 text-brand-600" />
            <span className="text-xs font-medium text-slate-700 line-clamp-2 break-all">
              {value?.name || 'Document uploaded — click to replace'}
            </span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2 px-3 text-center">
            <UploadCloud className="size-7" />
            <span className="text-xs font-medium">{label}</span>
          </span>
        )}
      </button>
    </div>
  );
}

/** Multiple image picker for new uploads (returns File[]). */
export function MultiImagePicker({ files, onChange, max = 8 }) {
  const inputRef = useRef(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p)), [previews]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {previews.map((src, i) => (
        <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(files.filter((_, idx) => idx !== i))}
            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {files.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-brand-400 hover:bg-brand-50/40"
        >
          <ImagePlus className="size-6" />
          <span className="text-xs font-medium">Add image</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files || []);
          onChange([...files, ...picked].slice(0, max));
          e.target.value = '';
        }}
      />
    </div>
  );
}
