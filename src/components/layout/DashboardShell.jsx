'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, ExternalLink } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Media';
import { Logo } from './SiteHeader';

/**
 * sections: [{ section: 'Label', items: [{ href, label, icon, exact?, badge? }] }]
 */
export default function DashboardShell({ sections, roleLabel, children, headerExtra }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === pathname;
  const setOpen = (v) => setOpenAt(v ? pathname : null);

  // Highlight only the most specific matching item (e.g. "Add product" rather than "Products")
  const allItems = sections.flatMap((s) => s.items);
  const activeHref = allItems
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (item) => item.href === activeHref;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
        <Logo light />
        {roleLabel && (
          <span className="rounded-md bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-300">{roleLabel}</span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((sec) => (
          <div key={sec.section} className="mb-5 last:mb-0">
            {sections.length > 1 && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{sec.section}</p>
            )}
            {sec.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item) ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">{item.badge}</span>
                ) : null}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <Link href="/" className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
          <ExternalLink className="size-4" /> View storefront
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar src={user?.kyc_profile?.profile_img} name={user?.full_name || user?.phone_number} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.full_name || 'User'}</p>
            <p className="truncate text-xs text-slate-400">{user?.phone_number}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-900 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl">{sidebar}</aside>
          <button onClick={() => setOpen(false)} className="absolute left-[18.5rem] top-4 rounded-full bg-white p-2 shadow" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="btn btn-ghost btn-icon lg:hidden -ml-2" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="flex-1">{headerExtra}</div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
