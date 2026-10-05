'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Eye, Package, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, getErrorMessage, mediaUrl, primaryImage, productPrice, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, Tabs, DescriptionList } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Media';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

function ReviewModal({ product, onClose, onChanged }) {
  const [commission, setCommission] = useState(product.woner_commission ?? '0');
  const [active, setActive] = useState(product.is_active);
  const [reason, setReason] = useState(product.rejection_reason || '');
  const [busy, setBusy] = useState('');

  const act = async (kind) => {
    setBusy(kind);
    try {
      if (Number(commission) !== Number(product.woner_commission) || active !== product.is_active) {
        await catalogApi.updateProduct(product.id, { woner_commission: commission || 0, is_active: active });
      }
      if (kind === 'approve') await catalogApi.approveProduct(product.id);
      if (kind === 'reject') await catalogApi.rejectProduct(product.id, reason);
      toast.success(kind === 'approve' ? 'Product approved and live' : kind === 'reject' ? 'Product rejected' : 'Product updated');
      onChanged();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const { price, original } = productPrice(product);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={product.title}
      description={`${product.shop_name} · submitted ${formatDate(product.created_at)}`}
      footer={
        <>
          <Button variant="secondary" onClick={() => act('save')} loading={busy === 'save'}>Save only</Button>
          <Button variant="danger-outline" icon={XCircle} onClick={() => act('reject')} loading={busy === 'reject'}>Reject</Button>
          <Button icon={CheckCircle2} onClick={() => act('approve')} loading={busy === 'approve'}>Approve</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Thumb src={primaryImage(product)} seed={product.id} className="aspect-square w-full" />
          <div className="grid grid-cols-4 gap-2">
            {(product.images || []).slice(0, 8).map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={mediaUrl(img.image)} alt="" className="aspect-square rounded-md object-cover" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <DescriptionList
            items={[
              { label: 'Price', value: <span>{formatPrice(price)} {original && <span className="text-slate-400 line-through">{formatPrice(original)}</span>}</span> },
              { label: 'Stock / MOQ', value: `${product.stock_quantity} / ${product.moq}` },
              { label: 'Category', value: product.category_name },
              { label: 'Size', value: product.size },
              { label: 'Status', value: <StatusBadge status={product.approval_status} /> },
              { label: 'Discount', value: product.discount_type === 'NONE' ? 'None' : `${product.discount_value} ${product.discount_type === 'PERCENTAGE' ? '%' : '৳'}` },
              { label: 'Description', value: <span className="whitespace-pre-line">{product.description || '—'}</span>, full: true },
            ]}
          />
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <Field label="Platform commission (%)" hint="Debited from the vendor wallet on each approved order">
              <Input type="number" min="0" max="100" step="0.1" value={commission} onChange={(e) => setCommission(e.target.value)} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} label="Active" description="Visible in the marketplace" />
            </div>
            <Field label="Rejection reason (if rejecting)" className="sm:col-span-2">
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell the vendor what to fix" />
            </Field>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminProductsPage() {
  const [tab, setTabState] = useState('PENDING');
  const setTab = (v) => {
    setTabState(v);
    setPage(1);
  };
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(
    () => catalogApi.products({ approval_status: tab === 'ALL' ? '' : tab, search: debounced, page, page_size: 15 }),
    [tab, debounced, page]
  );
  const pendingCount = useFetch(() => catalogApi.pendingProducts(), [data]);

  const quickApprove = async (p) => {
    try {
      await catalogApi.approveProduct(p.id);
      toast.success(`"${p.title}" approved`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Products" description="Review vendor submissions and manage the catalogue." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 md:flex-row md:items-end md:justify-between">
          <Tabs
            className="border-b-0"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'PENDING', label: 'Awaiting review', count: toList(pendingCount.data).length },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'ALL', label: 'All' },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search products or shops…" className="mb-3 md:w-64" />
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          empty={<EmptyState icon={Package} title={tab === 'PENDING' ? 'Review queue is empty' : 'No products'} description={tab === 'PENDING' ? 'New vendor submissions will appear here.' : undefined} />}
          columns={[
            {
              key: 'p',
              header: 'Product',
              render: (p) => (
                <button onClick={() => setSelected(p)} className="flex min-w-56 items-center gap-3 text-left">
                  <Thumb src={primaryImage(p)} seed={p.id} className="size-11" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 hover:text-brand-700 line-clamp-1">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.category_name}</p>
                  </div>
                </button>
              ),
            },
            { key: 'shop', header: 'Shop', render: (p) => <Link href={`/shops/${p.shop}`} className="text-slate-700 hover:text-brand-700">{p.shop_name}</Link> },
            { key: 'price', header: 'Price', render: (p) => formatPrice(productPrice(p).price) },
            { key: 'stock', header: 'Stock', render: (p) => (p.stock_quantity <= 0 ? <Badge tone="red">0</Badge> : p.stock_quantity) },
            { key: 'comm', header: 'Commission', render: (p) => <span className="inline-flex items-center gap-1"><Percent className="size-3 text-slate-400" />{Number(p.woner_commission)}</span> },
            { key: 'status', header: 'Status', render: (p) => <div className="flex flex-col items-start gap-1"><StatusBadge status={p.approval_status} />{!p.is_active && <Badge>Hidden</Badge>}</div> },
            { key: 'date', header: 'Submitted', render: (p) => <span className="whitespace-nowrap text-slate-500">{formatDate(p.created_at)}</span> },
            {
              key: 'a',
              header: '',
              className: 'text-right',
              render: (p) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" icon={Eye} onClick={() => setSelected(p)}>Review</Button>
                  {p.approval_status !== 'APPROVED' && <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => quickApprove(p)}>Approve</Button>}
                </div>
              ),
            },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      {selected && <ReviewModal product={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}
