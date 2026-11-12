'use client';

import { useSyncExternalStore } from 'react';
import { catalogApi } from '@/lib/services';
import { toList } from '@/lib/utils';

// One request per page load, shared by the header, sidebar and filters
const EMPTY = [];
let cache = EMPTY;
let pending = null;
const listeners = new Set();

function load() {
  if (!pending) {
    pending = catalogApi
      .categoryTree()
      .then((res) => {
        cache = toList(res);
        listeners.forEach((notify) => notify());
      })
      .catch(() => {
        pending = null;
      });
  }
}

function subscribe(notify) {
  listeners.add(notify);
  if (cache === EMPTY) load();
  return () => listeners.delete(notify);
}

/**
 * Top-level categories (Class 1-12) with their `subcategories` (subjects).
 * Hydrates with an empty list (matching the server) and fills in once loaded.
 */
export function useCategoryTree() {
  return useSyncExternalStore(subscribe, () => cache, () => EMPTY);
}

/** Find a category (class or subject) and its parent in the tree. */
export function findCategory(tree, id) {
  for (const c of tree) {
    if (String(c.id) === String(id)) return { category: c, parent: null };
    const sub = (c.subcategories || []).find((s) => String(s.id) === String(id));
    if (sub) return { category: sub, parent: c };
  }
  return { category: null, parent: null };
}
