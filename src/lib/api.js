import axios from 'axios';
import { API_BASE_URL } from '@/config/env';
import { useAuthStore } from '@/store/auth';

const GUEST_KEY = 'accs_guest_id';

export function getGuestId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const guestId = getGuestId();
  if (guestId) config.headers['x-guest-id'] = guestId;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await axios.post(`${API_BASE_URL}/auth/getRefreshToken/`, { refresh_token: refreshToken });
  const { access_token, refresh_token } = res.data || {};
  if (!access_token) throw new Error('Refresh failed');
  useAuthStore.getState().setTokens(access_token, refresh_token || refreshToken);
  return access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';
    const isAuthCall = url.includes('/auth/login/') || url.includes('/auth/getRefreshToken/') || url.includes('/admin/login/');

    if (status === 401 && original && !original._retry && !isAuthCall && useAuthStore.getState().refreshToken) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshErr) {
        useAuthStore.getState().clearSession();
        return Promise.reject(error);
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/** Build multipart FormData from a plain object (skips empty values, supports arrays & files). */
export function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, v));
    else if (typeof value === 'boolean') fd.append(key, value ? 'true' : 'false');
    else fd.append(key, value);
  });
  return fd;
}
