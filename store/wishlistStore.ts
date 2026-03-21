import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WishlistState {
  items: string[];
  setItems: (productIds: string[]) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (productIds) => set({ items: Array.from(new Set(productIds)) }),
      addItem: (productId) =>
        set((state) => {
          if (state.items.includes(productId)) return state;
          return { items: [...state.items, productId] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((id) => id !== productId) })),
      toggleItem: (productId) =>
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items.filter((id) => id !== productId)
            : [...state.items, productId],
        })),
      hasItem: (productId) => get().items.includes(productId),
      clear: () => set({ items: [] }),
    }),
    {
      name: "babyonline-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
