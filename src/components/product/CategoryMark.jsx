import { createElement } from 'react';
import { classNo } from '@/lib/catalog';
import { categoryIcon } from '@/lib/categoryIcon';
import { mediaUrl } from '@/lib/utils';

/**
 * Small visual for a category, so new categories look right everywhere without extra setup:
 * the class number for "Class N", otherwise the image uploaded in Admin → Categories,
 * otherwise an icon matched from the name.
 */
export default function CategoryMark({ category, iconClassName = 'size-4' }) {
  const n = classNo(category?.name);
  if (n) return n;
  if (category?.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl(category.image)} alt="" className="size-full rounded-[inherit] object-cover" />;
  }
  return createElement(categoryIcon(category?.name), { className: iconClassName });
}
