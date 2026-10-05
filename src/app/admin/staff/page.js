'use client';

import { useMemo, useState } from 'react';
import { UserPlus, Pencil, Trash2, ShieldCheck, KeyRound, Plus, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, getErrorMessage, normalizePhone, toList } from '@/lib/utils';
import { PageHeader, Tabs } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Checkbox, Field, Input, PasswordInput, PhoneInput } from '@/components/ui/Field';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

function PermissionPicker({ permissions, value, onChange }) {
  const [q, setQ] = useState('');
  const filtered = permissions.filter((p) => `${p.name} ${p.codename}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter permissions…" className="mb-2" />
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
        {filtered.map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
            <input type="checkbox" checked={value.includes(p.id)} onChange={() => toggle(p.id)} className="accent-brand-600" />
            <span className="text-slate-700">{p.name}</span>
            <code className="ml-auto text-[11px] text-slate-400">{p.codename}</code>
          </label>
        ))}
      </div>
      <p className="hint">{value.length} selected</p>
    </div>
  );
}

function StaffModal({ staff, roles, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: staff?.full_name || '',
    phone_number: staff?.phone_number || '',
    password: '',
    is_active: staff ? staff.is_active : true,
    group_ids: staff ? staff.groups.map((g) => g.id) : [],
  });
  const [saving, setSaving] = useState(false);
  const toggleRole = (id) => setForm((f) => ({ ...f, group_ids: f.group_ids.includes(id) ? f.group_ids.filter((x) => x !== id) : [...f.group_ids, id] }));

  const save = async () => {
    setSaving(true);
    try {
      if (staff) await adminApi.updateStaff(staff.id, { full_name: form.full_name, is_active: form.is_active, group_ids: form.group_ids });
      else await adminApi.createStaff({ full_name: form.full_name, phone_number: normalizePhone(form.phone_number), password: form.password, group_ids: form.group_ids });
      toast.success(staff ? 'Staff updated' : 'Staff account created');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={staff ? 'Edit staff member' : 'Add staff member'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        {!staff && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mobile number"><PhoneInput value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} /></Field>
            <Field label="Password" hint="Min 6 characters"><PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" /></Field>
          </div>
        )}
        <div>
          <p className="label">Roles</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                className={`rounded-full border px-3 py-1 text-sm ${form.group_ids.includes(r.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        {staff && <Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} label="Active" description="Inactive staff cannot sign in." />}
      </div>
    </Modal>
  );
}

function RoleModal({ role, permissions, onClose, onSaved }) {
  const [name, setName] = useState(role?.name || '');
  const [perms, setPerms] = useState(role?.permissions || []);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      if (role) await adminApi.updateRole(role.id, { name, permissions: perms });
      else await adminApi.createRole({ name, permissions: perms });
      toast.success('Role saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open size="lg" onClose={onClose} title={role ? `Edit role “${role.name}”` : 'New role'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save role</Button></>}>
      <div className="space-y-4">
        <Field label="Role name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Order manager" /></Field>
        <Field label="Permissions"><PermissionPicker permissions={permissions} value={perms} onChange={setPerms} /></Field>
      </div>
    </Modal>
  );
}

export default function StaffPage() {
  const [tab, setTab] = useState('staff');
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const staff = useFetch(() => adminApi.staff({ page_size: 100 }), []);
  const roles = useFetch(() => adminApi.roles(), []);
  const permissions = useFetch(() => adminApi.permissions(), []);
  const roleList = toList(roles.data);
  const permList = useMemo(() => toList(permissions.data), [permissions.data]);

  const remove = async () => {
    try {
      if (toDelete.type === 'staff') await adminApi.deleteStaff(toDelete.item.id);
      else await adminApi.deleteRole(toDelete.item.id);
      toast.success('Deleted');
      toDelete.type === 'staff' ? staff.reload() : roles.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Give your team access to the admin console with fine-grained permissions."
        actions={
          tab === 'staff'
            ? <Button icon={UserPlus} onClick={() => setModal({ type: 'staff' })}>Add staff</Button>
            : <Button icon={Plus} onClick={() => setModal({ type: 'role' })}>New role</Button>
        }
      />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'staff', label: 'Staff members' }, { value: 'roles', label: 'Roles & permissions', count: roleList.length }]} />

      {tab === 'staff' ? (
        <div className="card">
          <DataTable
            loading={staff.loading}
            error={staff.error}
            onRetry={staff.reload}
            rows={toList(staff.data)}
            empty={<EmptyState icon={UserCog} title="No staff yet" />}
            columns={[
              {
                key: 'n',
                header: 'Name',
                render: (s) => (
                  <div>
                    <p className="flex items-center gap-1.5 font-medium text-slate-900">{s.full_name || '—'} {s.is_superuser && <ShieldCheck className="size-3.5 text-brand-600" />}</p>
                    <p className="text-xs text-slate-500">{s.phone_number}</p>
                  </div>
                ),
              },
              { key: 'r', header: 'Roles', render: (s) => (s.is_superuser ? <Badge tone="brand">Superadmin</Badge> : <div className="flex flex-wrap gap-1">{s.groups.map((g) => <Badge key={g.id}>{g.name}</Badge>)}{!s.groups.length && <span className="text-xs text-slate-400">No roles</span>}</div>) },
              { key: 'st', header: 'Status', render: (s) => <Badge tone={s.is_active ? 'green' : 'red'} dot>{s.is_active ? 'Active' : 'Disabled'}</Badge> },
              { key: 'd', header: 'Added', render: (s) => <span className="text-slate-500">{formatDate(s.created_at)}</span> },
              {
                key: 'a',
                header: '',
                className: 'text-right',
                render: (s) => !s.is_superuser && (
                  <div className="flex justify-end gap-1">
                    <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => setModal({ type: 'staff', item: s })} title="Edit"><Pencil className="size-4" /></button>
                    <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete({ type: 'staff', item: s })} title="Delete"><Trash2 className="size-4" /></button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleList.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><KeyRound className="size-4" /></span>
                  <p className="font-semibold capitalize text-slate-900">{r.name}</p>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => setModal({ type: 'role', item: r })} title="Edit"><Pencil className="size-4" /></button>
                  <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete({ type: 'role', item: r })} title="Delete"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{r.permission_details.length} permissions</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.permission_details.slice(0, 5).map((p) => <Badge key={p.id} className="text-[11px]">{p.codename}</Badge>)}
                {r.permission_details.length > 5 && <Badge className="text-[11px]">+{r.permission_details.length - 5}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'staff' && <StaffModal staff={modal.item} roles={roleList} onClose={() => setModal(null)} onSaved={staff.reload} />}
      {modal?.type === 'role' && <RoleModal role={modal.item} permissions={permList} onClose={() => setModal(null)} onSaved={roles.reload} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title={`Delete ${toDelete?.type === 'staff' ? 'staff member' : 'role'}?`}
        message={toDelete?.type === 'staff' ? `${toDelete?.item.full_name || toDelete?.item.phone_number} will lose access permanently.` : 'Users with this role lose its permissions.'}
        confirmLabel="Delete"
      />
    </>
  );
}
