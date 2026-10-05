'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { authApi } from '@/lib/services';
import { isAdmin, isVendor, roleOf } from '@/lib/utils';

export function useSession() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const fetchCart = useCartStore((s) => s.fetch);

  /** Accepts the `data` block of login / verify responses. */
  const startSession = useCallback(
    async (data) => {
      setSession(data);
      // Merge the guest cart into the user's cart
      fetchCart();
    },
    [setSession, fetchCart]
  );

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    const refresh = useAuthStore.getState().refreshToken;
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      /* ignore */
    }
    clearSession();
    fetchCart();
  }, [clearSession, fetchCart]);

  return {
    user,
    hydrated,
    isAuthenticated: Boolean(user && accessToken),
    role: roleOf(user),
    isAdmin: isAdmin(user),
    isVendor: isVendor(user),
    startSession,
    refreshUser,
    logout,
  };
}
