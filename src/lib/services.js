import api, { toFormData } from './api';
import { buildQuery } from './utils';

const get = (url, params) => api.get(url + buildQuery(params)).then((r) => r.data);
const post = (url, body, config) => api.post(url, body, config).then((r) => r.data);
const patch = (url, body, config) => api.patch(url, body, config).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

/* ---------------- Auth & Account ---------------- */
export const authApi = {
  login: (phone_number, password) => post('/auth/login/', { phone_number, password }),
  loginOtp: (phone_number) => post('/auth/login-otp/', { phone_number }),
  adminLogin: (phone_number, password) => post('/admin/login/', { phone_number, password }),
  logout: (refresh_token) => post('/auth/logout/', { refresh_token }),

  buyerRegister: (phone_number, full_name) => post('/auth/buyer/register/', { phone_number, full_name }),
  buyerVerify: (phone_number, otp_code) => post('/auth/buyer/register-verify/', { phone_number, otp_code }),

  vendorRegister: (data) => post('/auth/register/', toFormData(data), multipart),
  sendOtp: (phone_number) => post('/auth/send-otp/', { phone_number }),
  verifyOtp: (phone_number, otp_code) => post('/auth/verify-otp/', { phone_number, otp_code }),

  forgotPassword: (phone_number) => post('/auth/forgot-password/', { phone_number }),
  resetPassword: (data) => post('/auth/reset-password/', data),
  changePassword: (data) => post('/auth/change-password/', data),

  me: () => get('/auth/me/'),
  updateMe: (data) => patch('/auth/me/', data instanceof FormData ? data : toFormData(data), multipart),
  kycProfile: () => get('/auth/profile/'),

  getAddress: () => get('/auth/shipping-address/'),
  createAddress: (data) => post('/auth/shipping-address/', data),
  updateAddress: (data) => patch('/auth/shipping-address/', data),
  deleteAddress: () => del('/auth/shipping-address/'),
};

/* ---------------- Catalog ---------------- */
export const catalogApi = {
  categories: (params) => get('/products/categories', params),
  categoryTree: () => get('/products/categories/tree', { page_size: 100 }),
  createCategory: (data) => post('/products/categories', toFormData(data), multipart),
  updateCategory: (id, data) => patch(`/products/categories/${id}`, toFormData(data), multipart),
  deleteCategory: (id) => del(`/products/categories/${id}`),

  products: (params) => get('/products/products', params),
  product: (id) => get(`/products/products/${id}`),
  myProducts: (params) => get('/products/products/my-products', params),
  lowStock: (params) => get('/products/products/low-stock', params),
  pendingProducts: () => get('/products/products/pending'),
  createProduct: (data) => post('/products/products', toFormData(data), multipart),
  updateProduct: (id, data) => patch(`/products/products/${id}`, toFormData(data), multipart),
  deleteProduct: (id) => del(`/products/products/${id}`),
  approveProduct: (id) => post(`/products/products/${id}/approve`),
  rejectProduct: (id, rejection_reason) => post(`/products/products/${id}/reject`, { rejection_reason }),

  addImage: (product, image, is_primary = false) =>
    post('/products/product-images', toFormData({ product, image, is_primary }), multipart),
  setPrimaryImage: (id) => patch(`/products/product-images/${id}`, toFormData({ is_primary: true }), multipart),
  deleteImage: (id) => del(`/products/product-images/${id}`),
};

/* ---------------- Shops & Reviews ---------------- */
export const shopApi = {
  shops: (params) => get('/vendors/shops', params),
  shop: (id) => get(`/vendors/shops/${id}`),
  myShop: () => get('/vendors/shops/me'),
  dashboard: () => get('/vendors/shops/me/dashboard'),
  createShop: (data) => post('/vendors/shops', toFormData(data), multipart),
  updateShop: (id, data) => patch(`/vendors/shops/${id}`, toFormData(data), multipart),

  cities: () => get('/vendors/cities'),
  createCity: (name) => post('/vendors/cities', { name }),
  deleteCity: (id) => del(`/vendors/cities/${id}`),

  reviews: (params) => get('/vendors/reviews', params),
  createReview: (data) => post('/vendors/reviews', data),
  deleteReview: (id) => del(`/vendors/reviews/${id}`),
};

/* ---------------- Cart ---------------- */
export const cartApi = {
  get: () => get('/orders/cart/'),
  add: (product_id, quantity = 1) => post('/orders/cart/add/', { product_id, quantity }),
  update: (product_id, quantity) => post('/orders/cart/update_quantity/', { product_id, quantity }),
  remove: (product_id) => post('/orders/cart/remove/', { product_id }),
  clear: () => post('/orders/cart/clear/'),
};

/* ---------------- Buyer Orders ---------------- */
export const orderApi = {
  list: (params) => get('/orders/buyer/orders/', params),
  get: (id) => get(`/orders/buyer/orders/${id}/`),
  checkout: (data) => post('/orders/buyer/orders/', data),
  cancel: (id, reason) => post(`/orders/buyer/orders/${id}/cancel/`, { reason }),
  track: (id) => get(`/orders/buyer/orders/${id}/track/`),
};

/* ---------------- Vendor Orders ---------------- */
export const vendorOrderApi = {
  list: (params) => get('/orders/vendor/orders/', params),
  get: (id) => get(`/orders/vendor/orders/${id}/`),
  updateStatus: (id, status) => patch(`/orders/vendor/orders/${id}/update-status/`, { status }),
  restock: (id) => post(`/orders/vendor/orders/${id}/restock/`),
};

/* ---------------- Pathao ---------------- */
const pathaoList = (res) => res?.data?.data || [];
export const pathaoApi = {
  cities: () => get('/orders/pathao/cities/').then(pathaoList),
  zones: (city_id) => get('/orders/pathao/zones/', { city_id }).then(pathaoList),
  areas: (zone_id) => get('/orders/pathao/areas/', { zone_id }).then(pathaoList),
  stores: () => get('/orders/pathao/stores/').then(pathaoList),
  price: (data) => post('/orders/pathao/calculate-price/', data),
};

/* ---------------- Wallet ---------------- */
export const walletApi = {
  mine: () => get('/wallets/my-wallet/'),
  transactions: (params) => get('/wallets/transactions/', params),
};

/* ---------------- Core content ---------------- */
export const coreApi = {
  policies: () => get('/core/policies'),
  createPolicy: (data) => post('/core/policies', data),
  updatePolicy: (id, data) => patch(`/core/policies/${id}`, data),
  deletePolicy: (id) => del(`/core/policies/${id}`),
  about: () => get('/core/about-us'),
  createAbout: (data) => post('/core/about-us', data),
  updateAbout: (id, data) => patch(`/core/about-us/${id}`, data),
  deleteAbout: (id) => del(`/core/about-us/${id}`),
  announcements: () => get('/core/announcements/'),
  roles: () => get('/lookup/items/'),
};

/* ---------------- Admin ---------------- */
export const adminApi = {
  analytics: () => get('/admin/dashboard/analytics/'),

  users: (params) => get('/auth/', params),
  pendingUsers: (params) => get('/auth/pending', params),
  user: (id) => get(`/auth/${id}`),
  updateUser: (id, data) => patch(`/auth/${id}`, data),
  approveKyc: (id) => post(`/auth/${id}/approve-kyc`),
  rejectKyc: (id) => post(`/auth/${id}/reject-kyc`),
  suspend: (id) => post(`/auth/${id}/suspend`),
  unsuspend: (id) => post(`/auth/${id}/unsuspend`),

  orders: (params) => get('/orders/admin/orders/', params),
  order: (id) => get(`/orders/admin/orders/${id}/`),
  approveOrder: (id, data) => post(`/orders/admin/orders/${id}/approve/`, data),
  rejectOrder: (id, rejection_reason) => post(`/orders/admin/orders/${id}/reject/`, { rejection_reason }),
  dispatchPathao: (id, data) => post(`/orders/admin/orders/${id}/dispatch-pathao/`, data),
  trackPathao: (id) => get(`/orders/admin/orders/${id}/track-pathao/`),
  simulateDelivery: (id) => post(`/orders/admin/orders/${id}/simulate-delivery/`),
  restockOrder: (id) => post(`/orders/admin/orders/${id}/restock/`),
  courierSummary: () => get('/orders/admin/orders/courier-summary/'),
  commissions: (params) => get('/orders/admin/orders/commissions/', params),
  deliverySettings: () => get('/orders/admin/delivery-settings/'),
  updateDeliverySettings: (data) => patch('/orders/admin/delivery-settings/', data),

  vendorRatings: (params) => get('/admin/ratings/vendors/', params),
  adjustRating: (id, admin_rating_adjustment) =>
    patch(`/admin/ratings/vendors/${id}/adjust_rating/`, { admin_rating_adjustment }),

  wallets: (params) => get('/wallets/admin/all/', params),
  updateCreditLimit: (id, credit_limit) => patch(`/wallets/admin/all/${id}/update-credit-limit/`, { credit_limit }),
  addDiscount: (id, amount, description) => post(`/wallets/admin/all/${id}/add-discount/`, { amount, description }),
  walletTransactions: (params) => get('/wallets/admin/transactions/', params),
  blockedProfiles: (params) => get('/blocked-profiles/', params),

  staff: (params) => get('/admin/staff/', params),
  createStaff: (data) => post('/admin/staff/', data),
  updateStaff: (id, data) => patch(`/admin/staff/${id}/`, data),
  deleteStaff: (id) => del(`/admin/staff/${id}/`),
  roles: () => get('/admin/roles/'),
  createRole: (data) => post('/admin/roles/', data),
  updateRole: (id, data) => patch(`/admin/roles/${id}/`, data),
  deleteRole: (id) => del(`/admin/roles/${id}/`),
  permissions: () => get('/admin/permissions/'),

  broadcasts: (params) => get('/admin/broadcast/', params),
  createBroadcast: (data) => post('/admin/broadcast/', data),
  deleteBroadcast: (id) => del(`/admin/broadcast/${id}/`),
};
