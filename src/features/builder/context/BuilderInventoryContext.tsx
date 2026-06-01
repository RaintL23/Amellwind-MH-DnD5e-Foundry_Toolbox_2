import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Weapon, ArmorItem, CartEntry } from "@/shared/types";
import { useCart } from "@/features/shops/context/CartContext";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import {
  classifyCartEntry,
  resolveEquippableFromCart,
  type CartItemKind,
} from "../utils/cart-equipment.resolver";

interface BuilderInventoryContextValue {
  /** Raw cart lines (source of truth from shops). */
  cartItems: CartEntry[];
  /** Weapons resolved from cart item names. */
  weapons: Weapon[];
  /** Armors resolved from cart item names. */
  armors: ArmorItem[];
  totalItems: number;
  equippableCount: number;
  isSyncing: boolean;
  getEntryKind: (entry: CartEntry) => CartItemKind;
  removeFromCart: (name: string) => void;
}

const BuilderInventoryContext =
  createContext<BuilderInventoryContextValue | null>(null);

export function BuilderInventoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { items: cartItems, totalItems, removeItem } = useCart();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [armors, setArmors] = useState<ArmorItem[]>([]);
  const [weaponCatalog, setWeaponCatalog] = useState<Weapon[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllWeapons().then((catalog) => {
      if (!cancelled) setWeaponCatalog(catalog);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      setWeapons([]);
      setArmors([]);
      setIsSyncing(false);
      return;
    }

    if (weaponCatalog.length === 0) {
      setIsSyncing(true);
      return;
    }

    const { weapons: nextWeapons, armors: nextArmors } = resolveEquippableFromCart(
      cartItems,
      weaponCatalog,
    );
    setWeapons(nextWeapons);
    setArmors(nextArmors);
    setIsSyncing(false);
  }, [cartItems, weaponCatalog]);

  const equippableCount = weapons.length + armors.length;

  const getEntryKind = (entry: CartEntry): CartItemKind =>
    classifyCartEntry(entry, weaponCatalog);

  return (
    <BuilderInventoryContext.Provider
      value={{
        cartItems,
        weapons,
        armors,
        totalItems,
        equippableCount,
        isSyncing,
        getEntryKind,
        removeFromCart: removeItem,
      }}
    >
      {children}
    </BuilderInventoryContext.Provider>
  );
}

export function useBuilderInventory(): BuilderInventoryContextValue {
  const ctx = useContext(BuilderInventoryContext);
  if (!ctx) {
    throw new Error(
      "useBuilderInventory must be used inside BuilderInventoryProvider",
    );
  }
  return ctx;
}
