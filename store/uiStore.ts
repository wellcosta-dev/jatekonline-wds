import { create } from "zustand";
import { useCartStore } from "./cartStore";

interface UiState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeCategory: string | null;
  isCartDrawerOpen: () => boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  setActiveCategory: (category: string | null) => void;
  toggleCartDrawer: () => void;
  setCartDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  activeCategory: null,

  isCartDrawerOpen: () => useCartStore.getState().isDrawerOpen,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  closeSearch: () => set({ isSearchOpen: false }),

  setActiveCategory: (category) => set({ activeCategory: category }),

  toggleCartDrawer: () => useCartStore.getState().toggleDrawer(),

  setCartDrawerOpen: (open) => useCartStore.getState().setDrawerOpen(open),
}));
