import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

interface CartState {
  items: CartItem[];
  orders: Order[];
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER' };

const initialState: CartState = {
  items: [],
  orders: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'PLACE_ORDER': {
      if (state.items.length === 0) return state;
      const total = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
      const order: Order = {
        id: `ORD-${Date.now()}`,
        items: [...state.items],
        total,
        date: new Date().toISOString(),
        status: 'processing',
      };
      return { items: [], orders: [order, ...state.orders] };
    }
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  orders: Order[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => void;
  getItemQty: (productId: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((product: Product) => dispatch({ type: 'ADD_ITEM', product }), []);
  const removeItem = useCallback((productId: string) => dispatch({ type: 'REMOVE_ITEM', productId }), []);
  const updateQty = useCallback((productId: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', productId, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const placeOrder = useCallback(() => dispatch({ type: 'PLACE_ORDER' }), []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const getItemQty = useCallback(
    (productId: string) => state.items.find((i) => i.product.id === productId)?.quantity ?? 0,
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{ items: state.items, orders: state.orders, totalItems, totalPrice, addItem, removeItem, updateQty, clearCart, placeOrder, getItemQty }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
