import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/types";
import { FREE_SHIPPING_THRESHOLD, getShippingCost } from "@/lib/utils";
import type { ShippingMethod } from "@/lib/shipping";

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

function variantsMatch(
  a?: { size?: string; color?: string },
  b?: { size?: string; color?: string }
): boolean {
  const aSize = a?.size ?? "";
  const bSize = b?.size ?? "";
  const aColor = a?.color ?? "";
  const bColor = b?.color ?? "";
  return aSize === bSize && aColor === bColor;
}

function getItemPrice(item: CartItem): number {
  return item.product.salePrice ?? item.product.price;
}

function getMaxQuantity(product: Product): number {
  return product.stock > 0 ? product.stock : 99;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  selectedShippingMethod: ShippingMethod;
  couponCode: string | null;
  discount: number;
  itemCount: () => number;
  subtotal: () => number;
  shippingCost: () => number;
  total: () => number;
  addItem: (
    product: Product,
    quantity?: number,
    variant?: { size?: string; color?: string }
  ) => void;
  removeItem: (
    productId: string,
    variant?: { size?: string; color?: string }
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variant?: { size?: string; color?: string }
  ) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      selectedShippingMethod: "gls",
      couponCode: null,
      discount: 0,

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      subtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + getItemPrice(item) * item.quantity,
          0
        );
      },

      shippingCost: () => {
        return getShippingCost(get().subtotal(), get().selectedShippingMethod);
      },

      total: () => {
        const sub = get().subtotal();
        const disc = get().discount;
        const ship = get().shippingCost();
        return sub - disc + ship;
      },

      addItem: (product, quantity = 1, variant) => {
        set((state) => {
          const maxQuantity = getMaxQuantity(product);
          const safeQuantity = Math.max(1, Math.min(maxQuantity, quantity));
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id && variantsMatch(item.variant, variant)
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            const currentQuantity = newItems[existingIndex].quantity;
            newItems[existingIndex].quantity = Math.min(maxQuantity, currentQuantity + safeQuantity);
            return { items: newItems };
          }

          return {
            items: [...state.items, { product, quantity: safeQuantity, variant }],
          };
        });
      },

      removeItem: (productId, variant) => {
        set((state) => {
          const index = state.items.findIndex(
            (item) =>
              item.product.id === productId &&
              (variant ? variantsMatch(item.variant, variant) : true)
          );
          if (index < 0) return state;
          const newItems = state.items.filter((_, i) => i !== index);
          return { items: newItems };
        });
      },

      updateQuantity: (productId, quantity, variant) => {
        set((state) => {
          const index = state.items.findIndex(
            (item) =>
              item.product.id === productId &&
              (variant ? variantsMatch(item.variant, variant) : true)
          );
          if (index < 0) return state;
          if (quantity <= 0) {
            return {
              items: state.items.filter((_, i) => i !== index),
            };
          }
          const newItems = [...state.items];
          const maxQuantity = getMaxQuantity(newItems[index].product);
          newItems[index].quantity = Math.min(maxQuantity, quantity);
          return { items: newItems };
        });
      },

      clearCart: () =>
        set({ items: [], couponCode: null, discount: 0, selectedShippingMethod: "gls" }),

      toggleDrawer: () =>
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      setDrawerOpen: (open) => set({ isDrawerOpen: open }),

      setShippingMethod: (method) => set({ selectedShippingMethod: method }),

      applyCoupon: (code) => {
        const upper = code.toUpperCase().trim();
        let discountPercent = 0;
        if (upper === "BABA10") discountPercent = 10;
        else if (upper === "UJSZULOTT") discountPercent = 15;
        else return false;

        const sub = get().subtotal();
        const discountAmount = Math.round((sub * discountPercent) / 100);
        set({
          couponCode: upper,
          discount: discountAmount,
        });
        return true;
      },

      removeCoupon: () => set({ couponCode: null, discount: 0 }),
    }),
    {
      name: "babyonline-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discount: state.discount,
        selectedShippingMethod: state.selectedShippingMethod,
      }),
    }
  )
);
