import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Backend returns users as `{ user: {...}, kyc_profile: {...} }`.
 * We keep a flat user object with the KYC profile attached.
 */
export function normalizeUser(payload) {
  if (!payload) return null;
  if (payload.user && typeof payload.user === 'object') {
    return { ...payload.user, kyc_profile: payload.kyc_profile || null };
  }
  return payload;
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,

      setSession: ({ access_token, refresh_token, user }) =>
        set({
          accessToken: access_token || null,
          refreshToken: refresh_token || null,
          user: normalizeUser(user),
        }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user: normalizeUser(user) }),

      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'accs-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
      // Rehydrated manually on the client (see Providers) so SSR markup matches the first client render
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
