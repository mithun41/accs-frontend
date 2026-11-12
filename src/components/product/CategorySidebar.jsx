'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Feedback';

function ClassRow({ c, active, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasSubjects = c.subcategories?.length > 0;
  return (
    <li>
      <div className="flex items-center">
        <Link
          href={`/products?category=${c.id}`}
          className={cn(
            'flex flex-1 items-baseline gap-2 py-2 pl-4 pr-1 text-[14px] transition-colors hover:text-brand-600',
            active.has(String(c.id)) ? 'font-semibold text-brand-600' : 'text-slate-700'
          )}
        >
          {c.name}
          {c.description && <span className="truncate text-xs font-normal text-slate-400">{c.description}</span>}
        </Link>
        {hasSubjects && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex size-8 items-center justify-center text-slate-400 hover:text-brand-600"
            aria-label={`${open ? 'Hide' : 'Show'} ${c.name} subjects`}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        )}
      </div>
      {open && hasSubjects && (
        <ul className="mb-1 ml-4 border-l border-slate-200 pl-2">
          {c.subcategories.map((s) => (
            <li key={s.id}>
              <Link
                href={`/products?category=${s.id}`}
                className={cn(
                  'block rounded px-2 py-1 text-[13px] hover:text-brand-600',
                  active.has(String(s.id)) ? 'font-semibold text-brand-600' : 'text-slate-500'
                )}
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Left "Categories" panel listing Class 1-12 with expandable subjects (pbs.com.bd style). */
export default function CategorySidebar({ activeIds = [], className }) {
  const tree = useCategoryTree();
  const active = new Set(activeIds.map(String));

  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200/70 bg-white', className)}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <BookOpen className="size-4 text-brand-600" />
        <h2 className="text-[15px] font-semibold text-brand-600">Categories</h2>
      </div>
      {tree.length === 0 ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-3/4" />)}
        </div>
      ) : (
        <ul className="divide-y divide-slate-50 py-1">
          {tree.map((c) => (
            <ClassRow
              key={c.id}
              c={c}
              active={active}
              defaultOpen={active.has(String(c.id)) || (c.subcategories || []).some((s) => active.has(String(s.id)))}
            />
          ))}
        </ul>
      )}
      <Link href="/products" className="block border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
        See all books →
      </Link>
    </div>
  );
}
