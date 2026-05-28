import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, variant: string | undefined, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
});

const CART_KEY = 'pc_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      const key = `${newItem.product_id}__${newItem.variant?.option ?? ''}`;
      const existing = prev.find(i => `${i.product_id}__${i.variant?.option ?? ''}` === key);
      if (existing) {
        return prev.map(i =>
          `${i.product_id}__${i.variant?.option ?? ''}` === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (productId: string, variantOption?: string) => {
    setItems(prev => prev.filter(i =>
      !(i.product_id === productId && (i.variant?.option ?? '') === (variantOption ?? ''))
    ));
  };

  const updateQuantity = (productId: string, variantOption: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeItem(productId, variantOption);
      return;
    }
    setItems(prev => prev.map(i =>
      i.product_id === productId && (i.variant?.option ?? '') === (variantOption ?? '')
        ? { ...i, quantity: qty }
        : i
    ));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price + (i.variant?.price_modifier ?? 0)) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
