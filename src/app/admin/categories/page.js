'use client';

import { createElement, useState } from 'react';
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, FolderTree, Plus, Pencil, Trash2, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { getErrorMessage, toList } from '@/lib/utils';
import { categoryIcon } from '@/lib/categoryIcon';
import { MAX_CATEGORY_DEPTH, findPath, flattenCategories } from '@/lib/catalog';
import { refreshCategoryTree } from '@/hooks/useCategoryTree';
import { PageHeader } from '@/components/ui/Layout';
import { EmptyState, PageLoader, ErrorState } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { FilePicker, Thumb } from '@/components/ui/Media';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

function CategoryModal({ category, parentId, roots, onClose, onSaved }) {
  // Possible parents: anything above the deepest level, except this category and its own branch
  const parents = flattenCategories(roots).filter(
    ({ depth, path }) => depth < MAX_CATEGORY_DEPTH && !(category && path.some((x) => x.id === category.id))
  );
  const [form, setForm] = useState(() => {
    // New categories go after their siblings by default (e.g. a new top-level one after Class 12 and Stationery)
    const siblings = parentId ? findPath(roots, parentId).at(-1)?.subcategories || [] : roots;
    const nextPosition = siblings.reduce((max, c) => Math.max(max, Number(c.position) || 0), 0) + 1;
    return {
      name: category?.name || '',
      description: category?.description || '',
      parent: category ? category.parent || '' : parentId || '',
      position: category?.position ?? nextPosition,
    };
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
      refreshCategoryTree(); // header menus, home page and filters show it straight away
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
          <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-3">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus placeholder="e.g. Class 6, Mathematics or Ball Pens" />
            </Field>
            <Field label="Order" hint="Lower first">
              <Input type="number" min="0" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Field>
          </div>
          <Field label="Parent category" hint={`Leave empty for a top-level category. Up to ${MAX_CATEGORY_DEPTH} levels: category → sub-category → sub-sub-category.`}>
            <Select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">— Top level —</option>
              {parents.map(({ category: c, depth }) => (
                <option key={c.id} value={c.id}>{'\u00A0\u00A0\u00A0\u00A0'.repeat(depth - 1)}{depth > 1 ? '└ ' : ''}{c.name}</option>
              ))}
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

const ROW_INDENT = ['', 'pl-12 bg-slate-50/50', 'pl-20 bg-slate-50'];

function CategoryRow({ c, depth, parent, open, onToggle, onAdd, onEdit, onDelete }) {
  const icon = categoryIcon(parent?.name ? `${parent.name} ${c.name}` : c.name);
  const subs = c.subcategories?.length || 0;
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${ROW_INDENT[depth - 1] || ROW_INDENT[2]}`}>
      {depth > 1 && <CornerDownRight className="size-4 shrink-0 text-slate-300" />}
      {/* Clicking the category opens / closes its sub-categories */}
      <button
        type="button"
        onClick={() => subs > 0 && onToggle(c.id)}
        aria-expanded={subs > 0 ? open : undefined}
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${subs > 0 ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="flex size-5 shrink-0 items-center justify-center text-slate-400">
          {subs > 0 && <ChevronRight className={`size-4 transition-transform ${open ? 'rotate-90 text-brand-600' : ''}`} />}
        </span>
        {c.image ? <Thumb src={c.image} className="size-9" /> : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{createElement(icon, { className: 'size-4' })}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${depth === 1 ? 'font-semibold text-slate-900' : 'text-sm text-slate-700'}`}>{c.name}</span>
          {c.description && <span className="block truncate text-xs text-slate-500">{c.description}</span>}
        </span>
        {subs > 0 && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${open ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{subs} sub</span>
        )}
      </button>
      <div className="flex gap-1">
        {depth < MAX_CATEGORY_DEPTH && <Button size="sm" variant="ghost" icon={Plus} onClick={() => onAdd(c)}>Sub</Button>}
        <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => onEdit(c, parent)} title="Edit"><Pencil className="size-4" /></button>
        <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => onDelete(c)} title="Delete"><Trash2 className="size-4" /></button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data, loading, error, reload } = useFetch(() => catalogApi.categoryTree(), []);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Every category starts collapsed; ids of the ones opened to show their sub-categories
  const [expanded, setExpanded] = useState(() => new Set());
  const roots = toList(data);
  const rows = flattenCategories(roots);
  const parentIds = rows.filter((r) => r.category.subcategories?.length).map((r) => r.category.id);
  // A row is visible when every category above it is open
  const visible = rows.filter(({ path }) => path.slice(0, -1).every((a) => expanded.has(a.id)));
  const toggle = (id) => setExpanded((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allOpen = parentIds.length > 0 && parentIds.every((id) => expanded.has(id));

  const remove = async () => {
    setDeleting(true);
    try {
      await catalogApi.deleteCategory(toDelete.id);
      toast.success('Category deleted');
      refreshCategoryTree();
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

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the catalogue into categories, sub-categories and sub-sub-categories (e.g. Stationery → Pens & Pencils → Ball Pens)."
        actions={<Button icon={Plus} onClick={() => setModal({})}>New category</Button>}
      />
      {parentIds.length > 0 && (
        <div className="mb-3 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            icon={allOpen ? ChevronsDownUp : ChevronsUpDown}
            onClick={() => setExpanded(allOpen ? new Set() : new Set(parentIds))}
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
      )}
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {roots.length === 0 ? (
          <EmptyState icon={FolderTree} title="No categories yet" action={<Button icon={Plus} onClick={() => setModal({})}>Create the first one</Button>} />
        ) : (
          visible.map(({ category: c, depth, path }) => (
            <CategoryRow
              key={c.id}
              c={c}
              depth={depth}
              parent={path[path.length - 2] || null}
              open={expanded.has(c.id)}
              onToggle={toggle}
              onAdd={(node) => {
                // Open the parent so the new sub-category shows up after saving
                setExpanded((s) => new Set(s).add(node.id));
                setModal({ parentId: node.id });
              }}
              onEdit={(node, parent) => setModal({ category: { ...node, parent: parent?.id || null } })}
              onDelete={setToDelete}
            />
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
