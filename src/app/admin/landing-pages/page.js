'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, LayoutTemplate, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, getErrorMessage, mediaUrl, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { landingUrl } from '@/lib/marketing';
import DataTable from '@/components/ui/Table';

export default function LandingPagesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const { data, loading, error, reload } = useFetch(() => marketingApi.landingPages({ page, page_size: 15 }), [page]);

  const copy = async (slug) => {
    try {
      await navigator.clipboard.writeText(landingUrl(slug));
      toast.success('Link copied — share it on Facebook, SMS or anywhere');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const remove = async () => {
    try {
      await marketingApi.deleteLandingPage(toDelete.id);
      toast.success('Landing page deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Landing pages"
        description="Campaign pages with a hand-picked set of books. Customers choose the books and order from one page — no account needed."
        actions={<Button icon={Plus} href="/admin/landing-pages/new">New landing page</Button>}
      />
      <div className="card">
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          onRowClick={(r) => router.push(`/admin/landing-pages/${r.id}`)}
          empty={
            <EmptyState
              icon={LayoutTemplate}
              title="No landing pages yet"
              description="Create one for a campaign, e.g. “SSC Science Pack”, and share its link in your ads."
              action={<Button icon={Plus} href="/admin/landing-pages/new">Create landing page</Button>}
            />
          }
          columns={[
            {
              key: 'title',
              header: 'Page',
              render: (r) => (
                <div className="flex min-w-60 items-center gap-3">
                  {r.banner_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(r.banner_image)} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : (
                    <span className="flex h-10 w-16 items-center justify-center rounded text-white" style={{ background: r.theme_color }}><LayoutTemplate className="size-4" /></span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{r.title}</p>
                    <p className="truncate text-xs text-slate-500">/offer/{r.slug}</p>
                  </div>
                </div>
              ),
            },
            { key: 'items', header: 'Books', render: (r) => r.items?.length || 0 },
            { key: 'orders', header: 'Orders', render: (r) => <span className="font-semibold">{r.order_count}</span> },
            { key: 'status', header: 'Status', render: (r) => (r.is_active ? <Badge tone="green" dot>Live</Badge> : <Badge dot>Draft</Badge>) },
            { key: 'date', header: 'Created', render: (r) => <span className="text-slate-500">{formatDate(r.created_at)}</span> },
            {
              key: 'a',
              header: '',
              className: 'text-right',
              render: (r) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => copy(r.slug)} title="Copy link"><Copy className="size-4" /></button>
                  <Link href={`/offer/${r.slug}`} target="_blank" className="btn btn-ghost btn-icon h-8 w-8" title="Open page"><ExternalLink className="size-4" /></Link>
                  <Link href={`/admin/landing-pages/${r.id}`} className="btn btn-ghost btn-icon h-8 w-8" title="Edit"><Pencil className="size-4" /></Link>
                  <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(r)} title="Delete"><Trash2 className="size-4" /></button>
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
        title={`Delete “${toDelete?.title}”?`}
        message="The page link will stop working. Orders already placed from it are kept."
        confirmLabel="Delete page"
      />
    </>
  );
}
