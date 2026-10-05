'use client';

import { useState } from 'react';
import { FolderTree, Plus, Pencil, Trash2, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { getErrorMessage, toList } from '@/lib/utils';
import { categoryIcon } from '@/lib/categoryIcon';
import { PageHeader } from '@/components/ui/Layout';
import { EmptyState, PageLoader, ErrorState } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { FilePicker, Thumb } from '@/components/ui/Media';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

function CategoryModal({ category, parentId, roots, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parent: category ? category.parent || '' : parentId || '',
  });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    const payload = { ...form, parent: form.parent || '' };
    if (image) payload.image = image;
    try {
      if (category) await catalogApi.updateCategory(category.id, payload);
      else await catalogApi.createCategory(payload);
      toast.success(category ? 'Category updated' : 'Category created');
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
      title={category ? 'Edit category' : 'New category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{category ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Parent category" hint="Leave empty for a top-level category">
            <Select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">— Top level —</option>
              {roots.filter((r) => r.id !== category?.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <Field label="Image">
          <FilePicker value={image} existingUrl={category?.image} onChange={setImage} aspect="aspect-square" label="Upload" />
        </Field>
      </div>
    </Modal>
  );
}

export default function AdminCategoriesPage() {
  const { data, loading, error, reload } = useFetch(() => catalogApi.categoryTree(), []);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const roots = toList(data);

  const remove = async () => {
    setDeleting(true);
    try {
      await catalogApi.deleteCategory(toDelete.id);
      toast.success('Category deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const Row = ({ c, parent }) => {
    const Icon = categoryIcon(parent?.name ? `${parent.name} ${c.name}` : c.name);
    return (
      <div className={`flex items-center gap-3 px-5 py-3 ${parent ? 'pl-12 bg-slate-50/50' : ''}`}>
        {parent && <CornerDownRight className="size-4 text-slate-300" />}
        {c.image ? <Thumb src={c.image} className="size-9" /> : (
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="size-4" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`truncate ${parent ? 'text-sm text-slate-700' : 'font-semibold text-slate-900'}`}>{c.name}</p>
          {c.description && <p className="truncate text-xs text-slate-500">{c.description}</p>}
        </div>
        {!parent && <span className="text-xs text-slate-400">{c.subcategories?.length || 0} sub</span>}
        <div className="flex gap-1">
          {!parent && <Button size="sm" variant="ghost" icon={Plus} onClick={() => setModal({ parentId: c.id })}>Sub</Button>}
          <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => setModal({ category: { ...c, parent: parent?.id || null } })} title="Edit"><Pencil className="size-4" /></button>
          <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)} title="Delete"><Trash2 className="size-4" /></button>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the catalogue into categories and sub-categories."
        actions={<Button icon={Plus} onClick={() => setModal({})}>New category</Button>}
      />
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {roots.length === 0 ? (
          <EmptyState icon={FolderTree} title="No categories yet" action={<Button icon={Plus} onClick={() => setModal({})}>Create the first one</Button>} />
        ) : (
          roots.map((c) => (
            <div key={c.id} className="divide-y divide-slate-100">
              <Row c={c} />
              {(c.subcategories || []).map((s) => <Row key={s.id} c={s} parent={c} />)}
            </div>
          ))
        )}
      </div>
      {modal && <CategoryModal {...modal} roots={roots} onClose={() => setModal(null)} onSaved={reload} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title={`Delete "${toDelete?.name}"?`}
        message="Sub-categories are deleted too. Products in these categories become uncategorised."
        confirmLabel="Delete"
      />
    </>
  );
}
