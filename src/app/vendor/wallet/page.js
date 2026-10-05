'use client';

import { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Gift, ShieldAlert } from 'lucide-react';
import { walletApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, formatPrice, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, Section, StatCard, Tabs } from '@/components/ui/Layout';
import { EmptyState, Alert, PageLoader } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import DataTable from '@/components/ui/Table';

export default function WalletPage() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const wallet = useFetch(() => walletApi.mine(), []);
  const tx = useFetch(() => walletApi.transactions({ transaction_type: type, page, page_size: 15 }), [type, page]);

  if (wallet.loading) return <PageLoader />;
  const w = wallet.data || {};
  const balance = Number(w.balance || 0);
  const limit = Number(w.credit_limit || 0);
  const headroom = balance + limit;
  const usedPct = limit > 0 && balance < 0 ? Math.min(100, Math.round((-balance / limit) * 100)) : 0;

  return (
    <>
      <PageHeader title="Wallet" description="Platform commissions are debited here as your orders are approved." />

      {balance < 0 && usedPct >= 75 && (
        <Alert tone={usedPct >= 100 ? 'error' : 'warning'} icon={ShieldAlert} className="mb-6" title={usedPct >= 100 ? 'Credit limit exceeded' : 'Approaching your credit limit'}>
          Your shop is automatically hidden when your balance falls below −{formatPrice(limit)}. Please settle your dues with ACCS.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={cn('card p-6 md:col-span-1', balance < 0 ? 'bg-gradient-to-br from-red-50 to-white' : 'bg-gradient-to-br from-brand-50 to-white')}>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><Wallet className="size-4" /> Current balance</div>
          <p className={cn('mt-3 text-3xl font-semibold tracking-tight', balance < 0 ? 'text-red-600' : 'text-slate-900')}>{formatPrice(balance)}</p>
          <p className="mt-1 text-xs text-slate-500">{balance < 0 ? 'Amount owed to ACCS' : 'Credit available'}</p>
        </div>
        <StatCard label="Credit limit" value={formatPrice(limit)} icon={ShieldAlert} tone="gray" hint="Maximum negative balance allowed" />
        <StatCard label="Remaining headroom" value={formatPrice(headroom)} icon={Gift} tone={headroom < limit * 0.25 ? 'red' : 'green'} hint={limit ? `${usedPct}% of credit used` : undefined} />
      </div>

      {limit > 0 && (
        <div className="card mt-4 p-5">
          <div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">Credit usage</span><span className="font-medium">{usedPct}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={cn('h-full rounded-full', usedPct >= 100 ? 'bg-red-500' : usedPct >= 75 ? 'bg-amber-500' : 'bg-brand-500')} style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      )}

      <Section title="Transactions" className="mt-6" bodyClassName="p-0">
        <div className="px-5 pt-2">
          <Tabs
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            tabs={[
              { value: '', label: 'All' },
              { value: 'OUT', label: 'Debits' },
              { value: 'IN', label: 'Credits' },
              { value: 'DISCOUNT', label: 'Discounts' },
            ]}
          />
        </div>
        <DataTable
          loading={tx.loading}
          error={tx.error}
          onRetry={tx.reload}
          rows={toList(tx.data)}
          empty={<EmptyState icon={Wallet} title="No transactions yet" description="Commission debits and refunds will appear here." />}
          columns={[
            {
              key: 'type',
              header: 'Type',
              render: (t) => (
                <div className="flex items-center gap-2">
                  <span className={cn('flex size-8 items-center justify-center rounded-full', t.transaction_type === 'OUT' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>
                    {t.transaction_type === 'OUT' ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                  </span>
                  <StatusBadge status={t.transaction_type} />
                </div>
              ),
            },
            { key: 'desc', header: 'Description', render: (t) => <span className="text-slate-700">{t.description || '—'}</span> },
            {
              key: 'order',
              header: 'Order',
              render: (t) => t.order_details ? (
                <div className="text-xs">
                  <p className="font-medium text-slate-800">{t.order_details.order_number}</p>
                  <p className="text-slate-500">{t.order_details.item?.product_name} × {t.order_details.item?.quantity}</p>
                </div>
              ) : '—',
            },
            {
              key: 'amount',
              header: 'Amount',
              className: 'text-right',
              headerClassName: 'text-right',
              render: (t) => (
                <span className={cn('font-semibold', t.transaction_type === 'OUT' ? 'text-red-600' : 'text-emerald-600')}>
                  {t.transaction_type === 'OUT' ? '−' : '+'}{formatPrice(t.amount)}
                </span>
              ),
            },
            { key: 'date', header: 'Date', render: (t) => <span className="text-slate-500 whitespace-nowrap">{formatDate(t.created_at, true)}</span> },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(tx.data)} page={page} onPageChange={setPage} /></div>
      </Section>
    </>
  );
}
