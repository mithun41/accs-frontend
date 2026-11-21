'use client';

import { useSyncExternalStore } from 'react';
import { catalogApi } from '@/lib/services';
import { toList } from '@/lib/utils';
import { findPath } from '@/lib/catalog';

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

/**
 * Reload the shared tree, e.g. after an admin adds, edits or deletes a category, so the
 * header menus, home page and filters pick up the change without a full page reload.
 */
export function refreshCategoryTree() {
  pending = null;
  load();
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

/** Find a category at any depth, with its top-level `root`, direct `parent` and full `path`. */
export function findCategory(tree, id) {
  const path = findPath(tree, id);
  const category = path[path.length - 1] || null;
  return { category, parent: path.length > 1 ? path[path.length - 2] : null, root: path[0] || null, path };
}
