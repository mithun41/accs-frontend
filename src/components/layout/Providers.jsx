'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { authApi } from '@/lib/services';

export default function Providers({ children }) {
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    useCartStore.getState().fetch();
    // Keep the cached user in sync with the backend (role / approval may change)
    if (useAuthStore.getState().accessToken) {
      authApi
        .me()
        .then((me) => useAuthStore.getState().setUser(me))
        .catch(() => {});
    }
  }, [hydrated]);

  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 3500 }} />
    </>
  );
}
