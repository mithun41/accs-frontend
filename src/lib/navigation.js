import {
  LayoutDashboard, Package, User, MapPin, Settings, Store, PlusCircle, ShoppingBag, Wallet, Star,
  FolderTree, Users, UserCog, Percent, Megaphone, SlidersHorizontal, Boxes,
} from 'lucide-react';
import { isAdmin, isVendor } from './utils';

/**
 * One navigation tree for every role. Each item can declare:
 *  - `when(session)`: role requirement
 *  - `perms`: Django permission codenames; any one of them grants access
 *    (superusers and ADMIN-role users bypass permission checks)
 */
const NAV = [
  {
    section: 'My account',
    items: [
      { href: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/account/orders', label: 'My orders', icon: Package },
      { href: '/account/profile', label: 'My profile', icon: User },
      { href: '/account/address', label: 'Delivery address', icon: MapPin },
      { href: '/account/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    section: 'My shop',
    when: (s) => s.isVendor,
    items: [
      { href: '/vendor', label: 'Shop overview', icon: Store, exact: true },
      { href: '/vendor/products', label: 'Products', icon: Boxes, exact: true },
      { href: '/vendor/products/new', label: 'Add product', icon: PlusCircle, exact: true },
      { href: '/vendor/orders', label: 'Shop orders', icon: ShoppingBag },
      { href: '/vendor/wallet', label: 'Wallet', icon: Wallet },
      { href: '/vendor/reviews', label: 'Reviews', icon: Star },
      { href: '/vendor/shop', label: 'Shop profile', icon: SlidersHorizontal },
    ],
  },
  {
    section: 'Administration',
    when: (s) => s.isAdmin,
    items: [
      { href: '/admin', label: 'Analytics', icon: LayoutDashboard, exact: true },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, perms: ['view_order', 'change_order'] },
      { href: '/admin/products', label: 'Products', icon: Package, perms: ['view_product', 'change_product'] },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree, perms: ['view_category', 'change_category'] },
      { href: '/admin/shops', label: 'Shops & ratings', icon: Store, perms: ['view_shopprofile', 'change_shopprofile'] },
      { href: '/admin/users', label: 'Users & KYC', icon: Users, perms: ['view_user', 'change_user'] },
      { href: '/admin/staff', label: 'Staff & roles', icon: UserCog, perms: ['view_group', 'change_group'] },
      { href: '/admin/wallets', label: 'Vendor wallets', icon: Wallet, perms: ['view_wallet', 'change_wallet'] },
      { href: '/admin/commissions', label: 'Commissions', icon: Percent, perms: ['view_ordercommission', 'change_ordercommission'] },
      { href: '/admin/broadcasts', label: 'Announcements', icon: Megaphone, perms: ['view_broadcastannouncement', 'add_broadcastannouncement'] },
      { href: '/admin/settings', label: 'Settings', icon: Settings, perms: ['change_deliverycharge', 'change_policy', 'change_city'] },
    ],
  },
];

export function buildSession(user) {
  const permissions = user?.permissions || [];
  // Superusers and ADMIN-role users see everything; other staff are limited by their permissions
  const fullAccess = Boolean(user?.is_superuser || permissions.includes('all') || isRoleAdmin(user));
  return {
    user,
    isAdmin: isAdmin(user),
    isVendor: isVendor(user),
    hasPerm: (perms) => !perms || fullAccess || perms.some((p) => permissions.includes(p)),
  };
}

function isRoleAdmin(user) {
  const role = typeof user?.role === 'object' && user.role ? user.role.value : user?.role;
  return String(role || '').toUpperCase() === 'ADMIN';
}

/** Navigation sections visible to this user: [{ section, items }] */
export function navFor(user) {
  const s = buildSession(user);
  return NAV.filter((sec) => !sec.when || sec.when(s))
    .map((sec) => ({ section: sec.section, items: sec.items.filter((i) => s.hasPerm(i.perms)) }))
    .filter((sec) => sec.items.length > 0);
}

/** Whether the user may open `pathname` (matched against the most specific nav item). */
export function canOpen(user, pathname) {
  const all = NAV.flatMap((sec) => sec.items.map((i) => ({ ...i, when: sec.when })));
  const match = all
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!match) return true;
  const s = buildSession(user);
  if (match.when && !match.when(s)) return false;
  return s.hasPerm(match.perms);
}

/** Where to send a user after login when there is no `next` target. */
export function dashboardHome(user) {
  if (isAdmin(user)) return '/admin';
  if (isVendor(user)) return '/vendor';
  return '/account';
}
