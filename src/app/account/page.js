'use client';

import Link from 'next/link';
import {
  Package, Clock, CheckCircle2, Megaphone, ArrowRight, User, MapPin, Settings, ShoppingBag, Store, LayoutDashboard, Heart,
} from 'lucide-react';
import { coreApi, orderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useSession } from '@/hooks/useSession';
import { formatDate, formatPrice, toList, toMeta } from '@/lib/utils';
import { orderProgress } from '@/lib/orders';
import { BannerAction, Section, StatCard, WelcomeBanner } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';
import { useT } from '@/i18n/LanguageProvider';

export default function AccountDashboard() {
  const t = useT();
  const { user, isVendor, isAdmin } = useSession();
  const recent = useFetch(() => orderApi.list({ page_size: 5 }), []);
  const pending = useFetch(() => orderApi.list({ page_size: 1, status: 'PENDING_ADMIN_APPROVAL' }), []);
  const approved = useFetch(() => orderApi.list({ page_size: 1, status: 'APPROVED' }), []);
  const announcements = useFetch(() => coreApi.announcements(), []);
  const notes = toList(announcements.data);

  const quickLinks = [
    { href: '/account/orders', label: 'My orders', text: 'Track and manage purchases', icon: Package },
    { href: '/account/profile', label: 'My profile', text: 'Name, photo & details', icon: User },
    { href: '/account/address', label: 'Delivery address', text: 'Used at checkout', icon: MapPin },
    { href: '/account/settings', label: 'Settings', text: 'Password & sign out', icon: Settings },
  ];

  return (
    <>
      <WelcomeBanner
        icon={User}
        title={user?.full_name ? `${t('Hello, {name}', { name: user.full_name.split(' ')[0] })} 👋` : `${t('Hello there')} 👋`}
        subtitle={t('Track your book orders, saved books and account settings in one place.')}
        actions={
          <>
            <BannerAction href="/products" icon={ShoppingBag} primary>{t('Continue shopping')}</BannerAction>
            <BannerAction href="/account/wishlist" icon={Heart}>{t('Wishlist')}</BannerAction>
          </>
        }
      />

      {(isVendor || isAdmin) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {isVendor && (
            <Link href="/vendor" className="card flex flex-1 items-center gap-3 p-4 transition-shadow hover:shadow-lift">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Store className="size-5" /></span>
              <div className="flex-1"><p className="font-semibold text-slate-900">{t('My shop')}</p><p className="text-xs text-slate-500">{t('Products, orders & wallet')}</p></div>
              <ArrowRight className="size-4 text-slate-300" />
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="card flex flex-1 items-center gap-3 p-4 transition-shadow hover:shadow-lift">
              <span className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><LayoutDashboard className="size-5" /></span>
              <div className="flex-1"><p className="font-semibold text-slate-900">{t('Administration')}</p><p className="text-xs text-slate-500">{t('Marketplace analytics & management')}</p></div>
              <ArrowRight className="size-4 text-slate-300" />
            </Link>
          )}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('Total orders')} value={toMeta(recent.data)?.count ?? 0} icon={Package} href="/account/orders" />
        <StatCard label={t('Awaiting approval')} value={toMeta(pending.data)?.count ?? 0} icon={Clock} tone="yellow" href="/account/orders" />
        <StatCard label={t('Confirmed')} value={toMeta(approved.data)?.count ?? 0} icon={CheckCircle2} tone="green" href="/account/orders" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section
          title={t('Recent orders')}
          actions={<Link href="/account/orders" className="link flex items-center gap-1 text-sm">{t('View all')} <ArrowRight className="size-4" /></Link>}
          bodyClassName="p-0"
        >
          <DataTable
            loading={recent.loading}
            rows={toList(recent.data)}
            empty={<EmptyState icon={Package} title={t('No orders yet')} description={t('Your orders will show up here.')} action={<Button href="/products">{t('Start shopping')}</Button>} />}
            columns={[
              { key: 'no', header: t('Order'), render: (o) => <Link href={`/account/orders/${o.id}`} className="link">{o.order_number}</Link> },
              { key: 'items', header: t('Items'), render: (o) => (o.items || []).length },
              { key: 'total', header: t('Total'), render: (o) => <span className="font-medium">{formatPrice(o.grand_total)}</span> },
              { key: 'status', header: t('Status'), render: (o) => { const p = orderProgress(o); return <Badge tone={p.tone} dot>{t(p.label)}</Badge>; } },
              { key: 'date', header: t('Placed'), render: (o) => <span className="whitespace-nowrap text-slate-500">{formatDate(o.created_at)}</span> },
            ]}
          />
        </Section>

        <div className="space-y-6">
          <Section title={t('Quick links')} bodyClassName="p-2">
            {quickLinks.map(({ href, label, text, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                <Icon className="size-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{t(label)}</p>
                  <p className="text-xs text-slate-500">{t(text)}</p>
                </div>
                <ArrowRight className="size-4 text-slate-300" />
              </Link>
            ))}
          </Section>

          {notes.length > 0 && (
            <Section title={t('Announcements')} bodyClassName="p-0">
              <ul className="divide-y divide-slate-100">
                {notes.slice(0, 3).map((n) => (
                  <li key={n.id} className="flex gap-3 px-5 py-4">
                    <Megaphone className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
