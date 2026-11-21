/**
 * Catalogue helpers. Top-level categories named "Class 1" … "Class 12" are the book classes;
 * any other top-level category (e.g. "Stationery") is a separate department of the shop.
 */

/** Class number of a category name ("Class 7" → 7), or null when it is not a class. */
export function classNo(name = '') {
  const match = /^Class\s*(\d+)$/i.exec(String(name).trim());
  return match ? Number(match[1]) : null;
}

export const isClassCategory = (category) => classNo(category?.name) !== null;

/** Splits the category tree into the Class 1-12 book classes and the other departments. */
export function splitCategories(tree = []) {
  return {
    classes: tree.filter(isClassCategory),
    departments: tree.filter((c) => !isClassCategory(c)),
  };
}

export const isStationery = (name = '') => /stationer/i.test(String(name));

/** The Stationery department (top-level category), if it exists. */
export const findStationery = (tree = []) => tree.find((c) => !isClassCategory(c) && isStationery(c.name)) || null;

/** Deepest level allowed: category → sub-category → sub-sub-category (matches the API). */
export const MAX_CATEGORY_DEPTH = 3;

/**
 * Flattens the tree in display order: [{ category, depth, path }] where `path` is the list of
 * categories from the top level down to (and including) this one.
 */
export function flattenCategories(tree = [], depth = 1, path = []) {
  return tree.flatMap((category) => {
    const here = [...path, category];
    return [{ category, depth, path: here }, ...flattenCategories(category.subcategories || [], depth + 1, here)];
  });
}

/** Categories from the top level down to the one with `id` (empty when not found). */
export function findPath(tree = [], id) {
  for (const category of tree) {
    if (String(category.id) === String(id)) return [category];
    const below = findPath(category.subcategories || [], id);
    if (below.length) return [category, ...below];
  }
  return [];
}

/** Ids (as strings) of every category below `category`, at any depth. */
export function descendantIds(category) {
  return (category?.subcategories || []).flatMap((c) => [String(c.id), ...descendantIds(c)]);
}

/**
 * Describes a product's place in the catalogue from its `category_details`:
 * books belong to a class (then subject…), other items to a department (then type…).
 * `path` is every category name from the top level down to the product's own category.
 */
export function productKind(category) {
  if (!category) return { isBook: false, root: null, leaf: null, path: [] };
  const ancestors = category.ancestors || (category.parent ? [{ id: category.parent, name: category.parent_name }] : []);
  const path = [...ancestors, { id: category.id, name: category.name }];
  const root = path[0]?.name || null;
  const leaf = path.length > 1 ? path.slice(1).map((c) => c.name).join(' › ') : null;
  return { isBook: classNo(root) !== null, root, leaf, path };
}
