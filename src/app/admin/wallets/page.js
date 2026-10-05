'use client';

import { useEffect, useState } from 'react';
import { Wallet, Gift, SlidersHorizontal, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, formatPrice, getErrorMessage, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, Tabs } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

function WalletModal({ mode, wallet, onClose, onSaved }) {
  const [amount, setAmount] = useState(mode === 'limit' ? wallet.credit_limit : '');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      if (mode === 'limit') await adminApi.updateCreditLimit(wallet.id, amount);
      else await adminApi.addDiscount(wallet.id, amount, description || 'Admin credit');
      toast.success(mode === 'limit' ? 'Credit limit updated' : 'Credit added to wallet');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const name = wallet.shop_profile?.shop_name || wallet.user_info?.full_name || wallet.user_info?.phone_number;
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={mode === 'limit' ? 'Update credit limit' : 'Add credit / settle dues'}
      description={`${name} · balance ${formatPrice(wallet.balance)}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}
    >
      <div className="space-y-4">
        <Field label={mode === 'limit' ? 'Credit limit (৳)' : 'Amount (৳)'} hint={mode === 'limit' ? 'Shop is blocked when balance drops below minus this amount.' : 'Record a payment received from the vendor or a goodwill credit.'}>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        {mode === 'credit' && (
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. bKash payment TXN123" />
          </Field>
        )}
      </div>
    </Modal>
  );
}

export default function AdminWalletsPage() {
  const [tab, setTabState] = useState('wallets');
  const setTab = (v) => {
    setTabState(v);
    setPage(1);
  };
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(() => {
    const q = { search: debounced, page, page_size: 15 };
    if (tab === 'transactions') return adminApi.walletTransactions(q);
    if (tab === 'blocked') return adminApi.blockedProfiles(q);
    return adminApi.wallets(q);
  }, [tab, debounced, page]);

  const walletColumns = [
    {
      key: 'v',
      header: 'Vendor',
      render: (w) => (
        <div>
          <p className="font-medium text-slate-900">{w.shop_profile?.shop_name || w.user_info?.full_name || '—'}</p>
          <p className="text-xs text-slate-500">{w.user_info?.phone_number} · {w.user_info?.role || '—'}</p>
        </div>
      ),
    },
    { key: 'b', header: 'Balance', render: (w) => <span className={cn('font-semibold', Number(w.balance) < 0 ? 'text-red-600' : 'text-slate-900')}>{formatPrice(w.balance)}</span> },
    { key: 'l', header: 'Credit limit', render: (w) => formatPrice(w.credit_limit) },
    {
      key: 'u',
      header: 'Usage',
      render: (w) => {
        const pct = Number(w.balance) < 0 && Number(w.credit_limit) > 0 ? Math.min(100, Math.round((-Number(w.balance) / Number(w.credit_limit)) * 100)) : 0;
        return (
          <div className="w-28">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full', pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-brand-500')} style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-xs text-slate-500">{pct}%</p>
          </div>
        );
      },
    },
    { key: 's', header: 'Shop', render: (w) => (w.shop_profile ? (w.shop_profile.is_blocked ? <Badge tone="red" dot>Blocked</Badge> : <Badge tone="green" dot>Active</Badge>) : <span className="text-xs text-slate-400">No shop</span>) },
    {
      key: 'a',
      header: '',
      className: 'text-right',
      render: (w) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon={SlidersHorizontal} onClick={() => setModal({ mode: 'limit', wallet: w })}>Limit</Button>
          <Button size="sm" variant="secondary" icon={Gift} onClick={() => setModal({ mode: 'credit', wallet: w })}>Add credit</Button>
        </div>
      ),
    },
  ];

  const txColumns = [
    {
      key: 't',
      header: 'Type',
      render: (t) => (
        <span className="inline-flex items-center gap-2">
          {t.transaction_type === 'OUT' ? <ArrowUpRight className="size-4 text-red-500" /> : <ArrowDownLeft className="size-4 text-emerald-500" />}
          <StatusBadge status={t.transaction_type} />
        </span>
      ),
    },
    { key: 'd', header: 'Description', render: (t) => t.description || '—' },
    { key: 'o', header: 'Order', render: (t) => (t.order_details ? <span className="text-xs"><strong>{t.order_details.order_number}</strong> · {t.order_details.vendor?.shop_name}</span> : '—') },
    { key: 'amt', header: 'Amount', render: (t) => <span className={cn('font-semibold', t.transaction_type === 'OUT' ? 'text-red-600' : 'text-emerald-600')}>{t.transaction_type === 'OUT' ? '−' : '+'}{formatPrice(t.amount)}</span> },
    { key: 'dt', header: 'Date', render: (t) => <span className="whitespace-nowrap text-slate-500">{formatDate(t.created_at, true)}</span> },
  ];

  return (
    <>
      <PageHeader title="Vendor wallets" description="Commission ledger, credit limits and blocked shops." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 md:flex-row md:items-end md:justify-between">
          <Tabs className="border-b-0" value={tab} onChange={setTab} tabs={[{ value: 'wallets', label: 'Wallets' }, { value: 'transactions', label: 'Transactions' }, { value: 'blocked', label: 'Blocked shops' }]} />
          <SearchInput value={search} onChange={setSearch} placeholder="Shop, name or phone…" className="mb-3 md:w-64" />
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          columns={tab === 'transactions' ? txColumns : walletColumns}
          empty={<EmptyState icon={Wallet} title={tab === 'blocked' ? 'No blocked shops' : 'Nothing here yet'} />}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      {modal && <WalletModal {...modal} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}
