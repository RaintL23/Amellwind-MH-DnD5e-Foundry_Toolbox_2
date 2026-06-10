import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
import { getLinkedInventoryNames } from "../utils/equipment-inventory.utils";

function mergeCartEntries(
  existing: CartEntry[],
  incoming: CartEntry[],
): CartEntry[] {
  const map = new Map<string, CartEntry>();
  for (const entry of existing) {
    map.set(entry.name, { ...entry });
  }
  for (const entry of incoming) {
    const prev = map.get(entry.name);
    if (prev) {
      map.set(entry.name, {
        ...prev,
        quantity: prev.quantity + entry.quantity,
      });
    } else {
      map.set(entry.name, { ...entry });
    }
  }
  return Array.from(map.values());
}

interface BuilderInventoryContextValue {
  items: CartEntry[];
  weapons: Weapon[];
  armors: ArmorItem[];
  trinkets: string[];
  totalItems: number;
  equippableCount: number;
  isSyncing: boolean;
  getEntryKind: (entry: CartEntry) => CartItemKind;
  addToInventory: (entry: CartEntry) => void;
  addEquipmentBundle: (entries: CartEntry[]) => void;
  removeFromInventory: (name: string) => void;
  removeWeaponInventoryBundle: (weaponName: string) => void;
  removeStartingEquipmentItem: (startingEquipmentId: string) => void;
  clearStartingEquipmentForSource: (type: string, sourceId: string) => void;
  clearInventory: () => void;
  purchaseFromCart: () => void;
}

const BuilderInventoryContext =
  createContext<BuilderInventoryContextValue | null>(null);

export function BuilderInventoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { items: cartItems, clearCart } = useCart();
  const [items, setItems] = useState<CartEntry[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [armors, setArmors] = useState<ArmorItem[]>([]);
  const [trinkets, setTrinkets] = useState<string[]>([]);
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
    if (items.length === 0) {
      setWeapons([]);
      setArmors([]);
      setTrinkets([]);
      setIsSyncing(false);
      return;
    }

    if (weaponCatalog.length === 0) {
      setIsSyncing(true);
      return;
    }

    const { weapons: nextWeapons, armors: nextArmors, trinkets: nextTrinkets } =
      resolveEquippableFromCart(items, weaponCatalog);
    setWeapons(nextWeapons);
    setArmors(nextArmors);
    setTrinkets(nextTrinkets);
    setIsSyncing(false);
  }, [items, weaponCatalog]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const equippableCount = weapons.length + armors.length;

  const getEntryKind = useCallback(
    (entry: CartEntry): CartItemKind =>
      classifyCartEntry(entry, weaponCatalog),
    [weaponCatalog],
  );

  const removeFromInventory = useCallback((name: string) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }, []);

  const removeWeaponInventoryBundle = useCallback((weaponName: string) => {
    const linkedNames = new Set(getLinkedInventoryNames(weaponName));
    setItems((prev) =>
      prev.filter(
        (entry) =>
          !linkedNames.has(entry.name) &&
          entry.linkedWeaponName !== weaponName,
      ),
    );
  }, []);

  const addEquipmentBundle = useCallback((entries: CartEntry[]) => {
    if (entries.length === 0) return;
    setItems((prev) => mergeCartEntries(prev, entries));
  }, []);

  const addToInventory = useCallback((entry: CartEntry) => {
    setItems((prev) => {
      if (entry.startingEquipmentId) {
        if (
          prev.some((i) => i.startingEquipmentId === entry.startingEquipmentId)
        ) {
          return prev;
        }
        return [...prev, { ...entry }];
      }
      return mergeCartEntries(prev, [entry]);
    });
  }, []);

  const removeStartingEquipmentItem = useCallback((startingEquipmentId: string) => {
    setItems((prev) =>
      prev.filter((entry) => entry.startingEquipmentId !== startingEquipmentId),
    );
  }, []);

  const clearStartingEquipmentForSource = useCallback(
    (type: string, sourceId: string) => {
      const prefix = `${type}:${sourceId}:`;
      setItems((prev) =>
        prev.filter((entry) => !entry.startingEquipmentId?.startsWith(prefix)),
      );
    },
    [],
  );

  const clearInventory = useCallback(() => {
    setItems([]);
  }, []);

  const purchaseFromCart = useCallback(() => {
    if (cartItems.length === 0) return;
    setItems((prev) => mergeCartEntries(prev, cartItems));
    clearCart();
  }, [cartItems, clearCart]);

  return (
    <BuilderInventoryContext.Provider
      value={{
        items,
        weapons,
        armors,
        trinkets,
        totalItems,
        equippableCount,
        isSyncing,
        getEntryKind,
        addToInventory,
        addEquipmentBundle,
        removeFromInventory,
        removeWeaponInventoryBundle,
        removeStartingEquipmentItem,
        clearStartingEquipmentForSource,
        clearInventory,
        purchaseFromCart,
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
