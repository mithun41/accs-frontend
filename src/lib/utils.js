import { API_BASE_URL } from '@/config/env';

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const taka = new Intl.NumberFormat('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `${n < 0 ? '−' : ''}৳${taka.format(Math.abs(n))}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Normalise paginated ({ data, meta }) and plain-array API responses. */
export function toList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.results)) return res.results;
  return [];
}

export function toMeta(res) {
  return res && !Array.isArray(res) && res.meta ? res.meta : null;
}

/** Extract a readable message from a DRF error response. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (!err.response) {
    return err.message === 'Network Error'
      ? 'Cannot reach the server. Please make sure the backend is running.'
      : err.message || fallback;
  }
  const data = err.response.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data.length < 200 ? data : fallback;
  if (Array.isArray(data)) return String(data[0]);
  const direct = data.error || data.detail || data.message;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object') return flattenErrors(direct)[0] || fallback;
  return flattenErrors(data)[0] || fallback;
}

function flattenErrors(obj) {
  const out = [];
  for (const [key, val] of Object.entries(obj)) {
    const label = key === 'non_field_errors' || key === 'detail' ? '' : `${humanize(key)}: `;
    if (Array.isArray(val)) out.push(label + val.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' '));
    else if (typeof val === 'string') out.push(label + val);
    else if (val && typeof val === 'object') out.push(...flattenErrors(val));
  }
  return out;
}

/** Field-level errors for forms: { field: 'message' } */
export function getFieldErrors(err) {
  const data = err?.response?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val) && typeof val[0] === 'string') out[key] = val[0];
    else if (typeof val === 'string' && key !== 'detail' && key !== 'error' && key !== 'message') out[key] = val;
  }
  return out;
}

export function humanize(str = '') {
  return String(str)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

/* ---------- Roles ---------- */
export const VENDOR_ROLES = ['VENDOR', 'RETAILER', 'WHOLESALER'];

export function roleOf(user) {
  if (!user) return null;
  const value = typeof user.role === 'object' && user.role ? user.role.value : user.role;
  return value ? String(value).toUpperCase() : null;
}

export function isAdmin(user) {
  if (!user) return false;
  return Boolean(user.is_staff || user.is_superuser || roleOf(user) === 'ADMIN');
}

export function isVendor(user) {
  return VENDOR_ROLES.includes(roleOf(user));
}


/* ---------- Products ---------- */
export function productPrice(product) {
  const base = Number(product?.price || 0);
  const after = product?.after_discount_price;
  const hasDiscount = after !== null && after !== undefined && Number(after) < base;
  return {
    price: hasDiscount ? Number(after) : base,
    original: hasDiscount ? base : null,
    discountPercent: hasDiscount && base > 0 ? Math.round(((base - Number(after)) / base) * 100) : 0,
  };
}

export function primaryImage(product) {
  const images = product?.images || [];
  const img = images.find((i) => i.is_primary) || images[0];
  return img ? mediaUrl(img.image) : null;
}

/** Normalise the phone number to the local 11-digit format (01XXXXXXXXX). */
export function normalizePhone(value = '') {
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('1')) digits = `0${digits}`;
  return digits;
}

export function isValidBDPhone(value) {
  return /^01[3-9]\d{8}$/.test(normalizePhone(value));
}

export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}
