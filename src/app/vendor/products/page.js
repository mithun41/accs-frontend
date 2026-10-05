'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2, Package, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice, getErrorMessage, primaryImage, productPrice, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, Tabs } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Media';
import { ConfirmDialog } from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

export default function VendorProductsPage() {
  const [status, setStatusState] = useState('');
  const setStatus = (v) => {
    setStatusState(v);
    setPage(1);
  };
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(
    () => catalogApi.myProducts({ approval_status: status, search: debounced, page, page_size: 15 }),
    [status, debounced, page]
  );
  const rows = toList(data);

  const remove = async () => {
    setDeleting(true);
    try {
      await catalogApi.deleteProduct(toDelete.id);
      toast.success('Product deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalogue, prices and stock."
        actions={<Button href="/vendor/products/new" icon={PlusCircle}>Add product</Button>}
      />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 md:flex-row md:items-end md:justify-between">
          <Tabs
            className="border-b-0"
            value={status}
            onChange={setStatus}
            tabs={[
              { value: '', label: 'All' },
              { value: 'APPROVED', label: 'Live' },
              { value: 'PENDING', label: 'In review' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search products…" className="mb-3 md:w-64" />
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={rows}
          empty={
            <EmptyState
              icon={Package}
              title={status || debounced ? 'No matching products' : 'No products yet'}
              description="Add your first product to start selling."
              action={<Button href="/vendor/products/new" icon={PlusCircle}>Add product</Button>}
            />
          }
          columns={[
            {
              key: 'product',
              header: 'Product',
              render: (p) => (
                <div className="flex items-center gap-3 min-w-56">
                  <Thumb src={primaryImage(p)} seed={p.id} className="size-11" />
                  <div className="min-w-0">
                    <Link href={`/vendor/products/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700 line-clamp-1">{p.title}</Link>
                    <p className="text-xs text-slate-500">{p.category_name || 'Uncategorised'}{p.size ? ` · ${p.size}` : ''}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'price',
              header: 'Price',
              render: (p) => {
                const { price, original } = productPrice(p);
                return (
                  <div>
                    <p className="font-medium">{formatPrice(price)}</p>
                    {original && <p className="text-xs text-slate-400 line-through">{formatPrice(original)}</p>}
                  </div>
                );
              },
            },
            {
              key: 'stock',
              header: 'Stock',
              render: (p) =>
                p.stock_quantity <= 0 ? <Badge tone="red">Out of stock</Badge>
                  : p.is_low_stock ? <Badge tone="yellow">{p.stock_quantity} low</Badge>
                    : <span className="font-medium">{p.stock_quantity}</span>,
            },
            { key: 'moq', header: 'MOQ', render: (p) => p.moq },
            {
              key: 'status',
              header: 'Status',
              render: (p) => (
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge status={p.approval_status} label={p.approval_status === 'APPROVED' ? 'Live' : p.approval_status === 'PENDING' ? 'In review' : undefined} />
                  {!p.is_active && <Badge tone="gray">Hidden</Badge>}
                </div>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (p) => (
                <div className="flex justify-end gap-1">
                  {p.approval_status === 'APPROVED' && (
                    <Link href={`/products/${p.id}`} target="_blank" className="btn btn-ghost btn-icon h-8 w-8" title="View in store"><Eye className="size-4" /></Link>
                  )}
                  <Link href={`/vendor/products/${p.id}`} className="btn btn-ghost btn-icon h-8 w-8" title="Edit"><Pencil className="size-4" /></Link>
                  <button onClick={() => setToDelete(p)} className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="size-4" /></button>
                </div>
              ),
            },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete product?"
        message={`"${toDelete?.title}" will be permanently removed from your shop.`}
        confirmLabel="Delete product"
      />
    </>
  );
}
