import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { CartEntry } from "@/shared/types";

interface CartContextValue {
  items: CartEntry[];
  addItem: (item: Omit<CartEntry, "quantity">) => void;
  removeItem: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);

  const addItem = useCallback((incoming: Omit<CartEntry, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === incoming.name);
      if (existing) {
        return prev.map((i) =>
          i.name === incoming.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...incoming, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((name: string) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }, []);

  const updateQuantity = useCallback((name: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.name !== name));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.name === name ? { ...i, quantity } : i)),
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
