import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  quantity: number;
  // Combo bundles — when true the item represents an entire combo deal
  isCombo?: boolean;
  comboItems?: Array<{ productName: string; size: string }>;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),

      addItem: (item) => set((state) => {
        // Combo items deduplicate by productId + encoded size string
        // Regular items deduplicate by productId + color + size
        const existingIndex = state.items.findIndex((i) =>
          i.productId === item.productId &&
          i.color    === item.color &&
          i.size     === item.size
        );

        if (existingIndex > -1) {
          const next = [...state.items];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + item.quantity,
          };
          return { items: next, isOpen: true };
        }

        const id = item.isCombo
          ? `combo-${item.productId}-${item.size ?? Date.now()}`
          : `${item.productId}-${item.color ?? ''}-${item.size ?? ''}`;

        return { items: [...state.items, { ...item, id }], isOpen: true };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ),
      })),

      clearCart: () => set({ items: [] }),
    }),
    { name: 'danana-cart' }
  )
);
