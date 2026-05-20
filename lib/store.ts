import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './data';

export interface CartItem {
  id: string; // unique string for the item + its variants
  productId: string;
  productTitle: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  quantity: number;
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
        const existingItemIndex = state.items.findIndex(
          i => i.productId === item.productId && i.color === item.color && i.size === item.size
        );
        
        if (existingItemIndex > -1) {
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity += item.quantity;
          return { items: newItems, isOpen: true };
        }
        
        const id = `${item.productId}-${item.color || ''}-${item.size || ''}`;
        return { items: [...state.items, { ...item, id }], isOpen: true };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) => item.id === id ? { ...item, quantity } : item)
      })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'danana-cart',
    }
  )
);
