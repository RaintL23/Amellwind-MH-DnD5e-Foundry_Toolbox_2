/**
 * Purchase callback for the shops cart. Layout injects Builder inventory via
 * CartPurchaseBridge so CartDrawer does not import the Builder feature.
 */
import { createContext, useContext, type ReactNode } from "react";

const CartPurchaseContext = createContext<(() => void) | null>(null);

export function CartPurchaseProvider({
  purchaseFromCart,
  children,
}: {
  purchaseFromCart: () => void;
  children: ReactNode;
}) {
  return (
    <CartPurchaseContext.Provider value={purchaseFromCart}>
      {children}
    </CartPurchaseContext.Provider>
  );
}

export function useCartPurchase(): () => void {
  const purchaseFromCart = useContext(CartPurchaseContext);
  if (!purchaseFromCart) {
    throw new Error("useCartPurchase must be used within CartPurchaseProvider");
  }
  return purchaseFromCart;
}
