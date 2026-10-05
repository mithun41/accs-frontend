import { create } from 'zustand';
import { cartApi } from '@/lib/services';

export const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,
  loaded: false,
  pendingProductId: null,

  count: () => (get().cart?.items || []).reduce((sum, i) => sum + i.quantity, 0),

  fetch: async () => {
    set({ loading: true });
    try {
      const cart = await cartApi.get();
      set({ cart });
      return cart;
    } catch {
      return null;
    } finally {
      set({ loading: false, loaded: true });
    }
  },

  add: async (productId, quantity = 1) => {
    set({ pendingProductId: productId });
    try {
      const cart = await cartApi.add(productId, quantity);
      set({ cart });
      return cart;
    } finally {
      set({ pendingProductId: null });
    }
  },

  update: async (productId, quantity) => {
    set({ pendingProductId: productId });
    try {
      const cart = await cartApi.update(productId, quantity);
      set({ cart });
      return cart;
    } finally {
      set({ pendingProductId: null });
    }
  },

  remove: async (productId) => {
    set({ pendingProductId: productId });
    try {
      const cart = await cartApi.remove(productId);
      set({ cart });
      return cart;
    } finally {
      set({ pendingProductId: null });
    }
  },

  clear: async () => {
    const cart = await cartApi.clear();
    set({ cart });
    return cart;
  },

  reset: () => set({ cart: null }),
}));
