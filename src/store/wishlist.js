import { create } from 'zustand';
import { wishlistApi } from '@/lib/services';

/** Ids of the signed-in user's saved books (loaded once per session). */
export const useWishlistStore = create((set, get) => ({
  ids: [],
  loaded: false,

  load: async () => {
    try {
      const res = await wishlistApi.list();
      set({ ids: res.ids || [], loaded: true });
    } catch {
      set({ ids: [], loaded: true });
    }
  },

  reset: () => set({ ids: [], loaded: false }),

  toggle: async (productId) => {
    const saved = get().ids.includes(productId);
    set({ ids: saved ? get().ids.filter((id) => id !== productId) : [...get().ids, productId] });
    try {
      if (saved) await wishlistApi.remove(productId);
      else await wishlistApi.add(productId);
      return !saved;
    } catch (err) {
      set({ ids: saved ? [...get().ids, productId] : get().ids.filter((id) => id !== productId) });
      throw err;
    }
  },
}));
