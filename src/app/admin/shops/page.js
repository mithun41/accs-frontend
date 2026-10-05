'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, getErrorMessage, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, Tabs } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { ShopLogo, Stars } from '@/components/ui/Media';
import { Field, Input } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

function AdjustModal({ shop, onClose, onSaved }) {
  const [value, setValue] = useState(shop.admin_rating_adjustment ?? 0);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await adminApi.adjustRating(shop.id, value);
      toast.success('Rating adjusted');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Adjust shop rating"
      description={shop.shop_name}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Apply</Button></>}
    >
      <p className="mb-4 text-sm text-slate-600">
        Current rating <strong>{Number(shop.average_rating).toFixed(2)}</strong> from {shop.total_reviews} reviews. The adjustment is added to the review average (clamped 0–5).
      </p>
      <Field label="Adjustment" hint="e.g. 0.5 to boost, -1 to penalise">
        <Input type="number" step="0.1" min="-5" max="5" value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
    </Modal>
  );
}

export default function AdminShopsPage() {
  const [type, setTypeState] = useState('');
  const setType = (v) => {
    setTypeState(v);
    setPage(1);
  };
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(
    () => adminApi.vendorRatings({ shop_type: type, search: debounced, page, page_size: 15 }),
    [type, debounced, page]
  );

  return (
    <>
      <PageHeader title="Shops & ratings" description="Monitor vendor shops and moderate their ratings." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 md:flex-row md:items-end md:justify-between">
          <Tabs className="border-b-0" value={type} onChange={setType} tabs={[{ value: '', label: 'All shops' }, { value: 'RETAILER', label: 'Retailers' }, { value: 'WHOLESALER', label: 'Wholesalers' }]} />
          <SearchInput value={search} onChange={setSearch} placeholder="Shop, phone or email…" className="mb-3 md:w-64" />
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          rowKey={(r) => r.shop_details.id}
          empty={<EmptyState icon={Store} title="No shops found" />}
          columns={[
            {
              key: 's',
              header: 'Shop',
              render: (r) => (
                <div className="flex items-center gap-3">
                  <ShopLogo src={r.shop_details.logo} name={r.shop_details.shop_name} className="size-10" />
                  <div>
                    <p className="font-medium text-slate-900">{r.shop_details.shop_name}</p>
                    <p className="text-xs text-slate-500">{r.shop_details.city?.name || '—'} · {r.shop_details.shop_type === 'WHOLESALER' ? 'Wholesaler' : 'Retailer'}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'o',
              header: 'Owner',
              render: (r) => (
                <div>
                  <p className="text-slate-800">{r.user_details?.full_name || '—'}</p>
                  <p className="text-xs text-slate-500">{r.user_details?.phone_number}</p>
                </div>
              ),
            },
            {
              key: 'r',
              header: 'Rating',
              render: (r) => (
                <div>
                  <Stars value={r.shop_details.average_rating} size="size-3.5" showValue />
                  <p className="text-xs text-slate-500">{r.shop_details.total_reviews} reviews{Number(r.shop_details.admin_rating_adjustment) ? ` · adj ${r.shop_details.admin_rating_adjustment > 0 ? '+' : ''}${r.shop_details.admin_rating_adjustment}` : ''}</p>
                </div>
              ),
            },
            { key: 'st', header: 'Status', render: (r) => (r.shop_details.is_blocked ? <Badge tone="red" dot>Blocked (credit)</Badge> : <Badge tone="green" dot>Active</Badge>) },
            { key: 'd', header: 'Created', render: (r) => <span className="text-slate-500">{formatDate(r.shop_details.created_at)}</span> },
            {
              key: 'a',
              header: '',
              className: 'text-right',
              render: (r) => (
                <div className="flex justify-end gap-1">
                  <Link href={`/shops/${r.shop_details.id}`} target="_blank" className="btn btn-ghost btn-icon h-8 w-8" title="View shop"><ExternalLink className="size-4" /></Link>
                  <Button size="sm" variant="secondary" icon={SlidersHorizontal} onClick={() => setAdjusting(r.shop_details)}>Adjust</Button>
                </div>
              ),
            },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      {adjusting && <AdjustModal shop={adjusting} onClose={() => setAdjusting(null)} onSaved={reload} />}
    </>
  );
}
