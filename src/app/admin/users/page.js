'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, BadgeCheck, Ban, CheckCircle2, XCircle, ShieldCheck, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, coreApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, getErrorMessage, humanize, mediaUrl, roleOf, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, Tabs, DescriptionList } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Media';
import { Select } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

function Doc({ label, src }) {
  if (!src) return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
      <FileImage className="mb-1 size-5" /> {label}: not provided
    </div>
  );
  return (
    <a href={mediaUrl(src)} target="_blank" rel="noreferrer" className="group block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(src)} alt={label} className="aspect-[4/3] w-full rounded-lg border border-slate-200 object-cover group-hover:opacity-90" />
      <p className="mt-1 text-xs text-slate-500">{label} ↗</p>
    </a>
  );
}

function UserModal({ record, onClose, onChanged }) {
  const u = record.user;
  const kyc = record.kyc_profile;
  const [busy, setBusy] = useState('');

  const act = async (kind, fn, msg) => {
    setBusy(kind);
    try {
      await fn();
      toast.success(msg);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={u.full_name || u.phone_number}
      description={`${humanize(roleOf(u) || (u.is_staff ? 'Staff' : 'User'))} · joined ${formatDate(u.created_at)}`}
      footer={
        <>
          {u.is_active ? (
            <Button variant="danger-outline" icon={Ban} loading={busy === 'suspend'} onClick={() => act('suspend', () => adminApi.suspend(u.id), 'Account suspended')}>Suspend</Button>
          ) : (
            <Button variant="secondary" icon={CheckCircle2} loading={busy === 'unsuspend'} onClick={() => act('unsuspend', () => adminApi.unsuspend(u.id), 'Account re-activated')}>Re-activate</Button>
          )}
          {kyc && kyc.status !== 'REJECTED' && (
            <Button variant="danger-outline" icon={XCircle} loading={busy === 'reject'} onClick={() => act('reject', () => adminApi.rejectKyc(u.id), 'KYC rejected')}>Reject KYC</Button>
          )}
          {kyc && (kyc.status !== 'APPROVED' || !u.is_approved) && (
            <Button icon={BadgeCheck} loading={busy === 'approve'} onClick={() => act('approve', () => adminApi.approveKyc(u.id), 'KYC approved — account activated')}>Approve KYC</Button>
          )}
          {!kyc && !u.is_approved && (
            <Button icon={BadgeCheck} loading={busy === 'approve2'} onClick={() => act('approve2', () => adminApi.updateUser(u.id, { is_approved: true }), 'Account approved')}>Approve account</Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4">
        <Avatar src={kyc?.profile_img} name={u.full_name || u.phone_number} className="size-14" />
        <div className="flex flex-wrap gap-2">
          <Badge tone={u.is_active ? 'green' : 'red'} dot>{u.is_active ? 'Active' : 'Suspended'}</Badge>
          <Badge tone={u.is_approved ? 'green' : 'yellow'} dot>{u.is_approved ? 'Approved' : 'Not approved'}</Badge>
          <Badge tone={u.is_phone_verified ? 'green' : 'yellow'} dot>{u.is_phone_verified ? 'Phone verified' : 'Phone unverified'}</Badge>
          {kyc && <StatusBadge status={kyc.status} label={`KYC ${humanize(kyc.status).toLowerCase()}`} />}
        </div>
      </div>
      <DescriptionList
        className="mt-6"
        items={[
          { label: 'Phone', value: u.phone_number },
          { label: 'Date of birth', value: u.date_of_birth ? formatDate(u.date_of_birth) : '—' },
          { label: 'Groups', value: (u.groups || []).join(', ') || '—' },
          { label: 'NID number', value: kyc?.nid_number || '—' },
          kyc?.verified_at && { label: 'KYC verified', value: formatDate(kyc.verified_at, true) },
        ]}
      />
      {kyc && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Doc label="NID front" src={kyc.nid_front_image} />
          <Doc label="NID back" src={kyc.nid_back_image} />
          <Doc label="Birth certificate" src={kyc.birth_certificate_image} />
        </div>
      )}
    </Modal>
  );
}

function UsersView() {
  const params = useSearchParams();
  const [tab, setTabState] = useState(params.get('tab') || 'all');
  const setTab = (v) => {
    setTabState(v);
    setPage(1);
  };
  const [roleId, setRoleIdState] = useState('');
  const setRoleId = (v) => {
    setRoleIdState(v);
    setPage(1);
  };
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const roles = useFetch(() => coreApi.roles(), []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(() => {
    const q = { search: debounced, role_id: roleId, page, page_size: 15 };
    if (tab === 'pending') return adminApi.pendingUsers(q);
    if (tab === 'kyc') return adminApi.users({ ...q, kyc_status: 'PENDING' });
    return adminApi.users(q);
  }, [tab, debounced, roleId, page]);

  return (
    <>
      <PageHeader title="Users & KYC" description="Approve sellers, verify documents and manage accounts." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            className="border-b-0"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All users' },
              { value: 'pending', label: 'Pending approval' },
              { value: 'kyc', label: 'KYC to review' },
            ]}
          />
          <div className="mb-3 flex gap-2">
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-40">
              <option value="">All roles</option>
              {toList(roles.data).filter((r) => r.name === 'ROLE').map((r) => <option key={r.id} value={r.id}>{humanize(r.value)}</option>)}
            </Select>
            <SearchInput value={search} onChange={setSearch} placeholder="Name or phone…" className="w-56" />
          </div>
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          rowKey={(r) => r.user.id}
          onRowClick={setSelected}
          empty={<EmptyState icon={Users} title="No users found" />}
          columns={[
            {
              key: 'u',
              header: 'User',
              render: (r) => (
                <div className="flex items-center gap-3">
                  <Avatar src={r.kyc_profile?.profile_img} name={r.user.full_name || r.user.phone_number} className="size-9" />
                  <div>
                    <p className="font-medium text-slate-900">{r.user.full_name || '—'}</p>
                    <p className="text-xs text-slate-500">{r.user.phone_number}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (r) => (
                <span className="inline-flex items-center gap-1">
                  {r.user.is_staff && <ShieldCheck className="size-3.5 text-brand-600" />}
                  {humanize(roleOf(r.user) || (r.user.is_superuser ? 'Superadmin' : r.user.is_staff ? 'Staff' : '—'))}
                </span>
              ),
            },
            { key: 'kyc', header: 'KYC', render: (r) => (r.kyc_profile ? <StatusBadge status={r.kyc_profile.status} /> : <span className="text-xs text-slate-400">—</span>) },
            {
              key: 'state',
              header: 'Account',
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {!r.user.is_active ? <Badge tone="red">Suspended</Badge> : r.user.is_approved ? <Badge tone="green">Active</Badge> : <Badge tone="yellow">Awaiting approval</Badge>}
                  {!r.user.is_phone_verified && <Badge tone="orange">Phone unverified</Badge>}
                </div>
              ),
            },
            { key: 'date', header: 'Joined', render: (r) => <span className="whitespace-nowrap text-slate-500">{formatDate(r.user.created_at)}</span> },
            { key: 'a', header: '', className: 'text-right', render: () => <span className="text-sm font-medium text-brand-700">Manage →</span> },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      {selected && <UserModal record={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersView />
    </Suspense>
  );
}
