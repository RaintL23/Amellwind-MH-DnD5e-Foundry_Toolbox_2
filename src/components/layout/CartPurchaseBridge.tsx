/**
 * Wires BuilderInventory.purchaseFromCart into shops. Lives in layout so
 * CartDrawer only talks to CartContext + CartPurchaseContext.
 */
import type { ReactNode } from "react";
import { useBuilderInventory } from "@/features/raintdm/builder/context/BuilderInventoryContext";
import { CartPurchaseProvider } from "@/features/amellwind/shops/context/CartPurchaseContext";

export function CartPurchaseBridge({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { purchaseFromCart } = useBuilderInventory();
  return (
    <CartPurchaseProvider purchaseFromCart={purchaseFromCart}>
      {children}
    </CartPurchaseProvider>
  );
}
