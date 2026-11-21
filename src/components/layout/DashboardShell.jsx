'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, ChevronRight, ExternalLink, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { coreApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, toList } from '@/lib/utils';
import { Avatar } from '@/components/ui/Media';
import { Logo } from './SiteHeader';
import { useT } from '@/i18n/LanguageProvider';
import LanguageToggle from '@/i18n/LanguageToggle';

/** Calls setOpen(false) when clicking outside the returned ref (setOpen is stable). */
function useOutsideClose(setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setOpen]);
  return ref;
}

function Announcements() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(setOpen);
  const { data } = useFetch(() => coreApi.announcements(), []);
  const notes = toList(data).slice(0, 6);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative btn btn-ghost btn-icon h-10 w-10" aria-label={t('Announcements')}>
        <Bell className="size-5" />
        {notes.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-600 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lift">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{t('Announcements')}</p>
          {notes.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">{t("You're all caught up.")}</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {notes.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, roleLabel, onLogout }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(setOpen);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100">
        <Avatar src={user?.kyc_profile?.profile_img} name={user?.full_name || user?.phone_number} className="size-8" />
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-32 truncate text-sm font-semibold text-slate-800">{user?.full_name || t('Account')}</span>
          <span className="block text-[11px] text-slate-500">{t(roleLabel)}</span>
        </span>
        <ChevronDown className="hidden size-4 text-slate-400 md:block" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift">
          <Link href="/account/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><User className="size-4 text-slate-400" /> {t('My profile')}</Link>
          <Link href="/account/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Settings className="size-4 text-slate-400" /> {t('Settings')}</Link>
          <button onClick={onLogout} className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-slate-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="size-4" /> {t('Sign out')}</button>
        </div>
      )}
    </div>
  );
}

/**
 * The one dashboard layout for every role.
 * sections: [{ section: 'Label', items: [{ href, label, icon, exact?, badge? }] }]
 */
export default function DashboardShell({ sections, roleLabel, children, headerExtra }) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === pathname;
  const setOpen = (v) => setOpenAt(v ? pathname : null);

  // Highlight only the most specific matching item (e.g. "Add product" rather than "Products")
  const allItems = sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.section })));
  const active = allItems
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const signOut = async () => {
    await logout();
    router.push('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo light />
      </div>

      <div className="mx-4 mb-2 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3 text-white ring-1 ring-white/10">
        <Avatar src={user?.kyc_profile?.profile_img} name={user?.full_name || user?.phone_number} className="size-10 ring-2 ring-accent-400/60" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.full_name || t('Welcome')}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-300">{t(roleLabel)}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((sec) => (
          <div key={sec.section} className="mb-4 last:mb-0">
            {sections.length > 1 && (
              <p className="mb-1 px-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-300/50">{t(sec.section)}</p>
            )}
            {sec.items.map((item) => {
              const isActive = active?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-brand-100/70 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {isActive && <span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r-full bg-accent-400" />}
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
                      isActive ? 'bg-accent-400 text-ink shadow-sm' : 'bg-white/5 text-brand-200 group-hover:bg-white/10 group-hover:text-white'
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <span className="flex-1 truncate">{t(item.label)}</span>
                  {item.badge ? <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">{item.badge}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-100/70 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-4" /> {t('Visit store')}
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-100/70 hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="size-4" /> {t('Sign out')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] bg-brand-950 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-brand-950 shadow-2xl">{sidebar}</aside>
          <button onClick={() => setOpen(false)} className="absolute left-[18.5rem] top-4 rounded-full bg-white p-2 shadow" aria-label={t('Close menu')}>
            <X className="size-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="btn btn-ghost btn-icon -ml-2 lg:hidden" onClick={() => setOpen(true)} aria-label={t('Open menu')}>
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              {active ? (
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
                  <span className="hidden sm:inline">{t(active.section)}</span>
                  <ChevronRight className="hidden size-3.5 sm:inline" />
                  <span className="font-semibold text-slate-900">{t(active.label)}</span>
                </p>
              ) : null}
              {headerExtra && <div className="truncate text-xs">{headerExtra}</div>}
            </div>
            <LanguageToggle className="hidden sm:flex" />
            <Link href="/" className="btn btn-secondary btn-sm hidden h-9 sm:inline-flex">
              <ExternalLink className="size-4" /> {t('View store')}
            </Link>
            <Announcements />
            <UserMenu user={user} roleLabel={roleLabel} onLogout={signOut} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
