import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { Weapon, ArmorItem, CartEntry } from "@/shared/types";
import { useCart } from "@/features/amellwind/shops/context/CartContext";
import { getAllWeapons } from "@/features/amellwind/weapons/services/weapon.service";
import {
  getDndArmors,
  getDndWeapons,
} from "@/features/dnd/items/services/dnd-equipment.service";
import { getAllForgeWeapons } from "@/features/raintdm/weapon-forge/services/weapon-forge.service";
import { loadUseAmellwindHomebrew } from "../storage/builder.storage";
import {
  classifyCartEntry,
  MH_ARMOR_CATALOG,
  resolveEquippableFromCart,
  type CartItemKind,
} from "../utils/cart-equipment.resolver";
import { getLinkedInventoryNames } from "../utils/equipment-inventory.utils";

function cartEntryKey(entry: CartEntry): string {
  return entry.startingEquipmentId ?? entry.name;
}

function mergeCartEntries(
  existing: CartEntry[],
  incoming: CartEntry[],
): CartEntry[] {
  const map = new Map<string, CartEntry>();
  for (const entry of existing) {
    map.set(cartEntryKey(entry), { ...entry });
  }
  for (const entry of incoming) {
    const key = cartEntryKey(entry);
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        ...prev,
        quantity: prev.quantity + entry.quantity,
      });
    } else {
      map.set(key, { ...entry });
    }
  }
  return Array.from(map.values());
}

interface BuilderInventoryContextValue {
  items: CartEntry[];
  weapons: Weapon[];
  armors: ArmorItem[];
  trinkets: string[];
  armorCatalog: ArmorItem[];
  totalItems: number;
  equippableCount: number;
  isSyncing: boolean;
  ensureWeaponCatalogsLoaded: () => void;
  getEntryKind: (entry: CartEntry) => CartItemKind;
  syncEquipmentCatalogs: (
    useAmellwindHomebrew: boolean,
    prefer2024: boolean,
  ) => void;
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
  const [armorCatalog, setArmorCatalog] = useState<ArmorItem[]>(MH_ARMOR_CATALOG);
  const [isSyncing, setIsSyncing] = useState(false);
  const catalogRequestRef = useRef(0);
  const catalogLoadedRef = useRef(false);

  const syncEquipmentCatalogs = useCallback(
    (useAmellwindHomebrew: boolean, prefer2024: boolean) => {
      const requestId = ++catalogRequestRef.current;
      setIsSyncing(true);
      setWeaponCatalog([]);
      setArmorCatalog([]);
      catalogLoadedRef.current = false;

      const load = useAmellwindHomebrew
        ? Promise.all([getAllForgeWeapons(), getAllWeapons()]).then(
            ([forgeWeapons, agmhWeapons]) => ({
              // Forge first so name lookups prefer curated/custom over AGMH base.
              weapons: [...forgeWeapons, ...agmhWeapons],
              armors: MH_ARMOR_CATALOG,
            }),
          )
        : Promise.all([
            getDndWeapons(prefer2024),
            getDndArmors(prefer2024),
          ]).then(([weapons, armors]) => ({ weapons, armors }));

      load
        .then(({ weapons, armors }) => {
          if (catalogRequestRef.current !== requestId) return;
          setWeaponCatalog(weapons);
          setArmorCatalog(armors);
          catalogLoadedRef.current = weapons.length > 0;
        })
        .finally(() => {
          if (catalogRequestRef.current === requestId) {
            setIsSyncing(false);
          }
        });
    },
    [],
  );

  const ensureWeaponCatalogsLoaded = useCallback(() => {
    if (catalogLoadedRef.current) return;
    syncEquipmentCatalogs(loadUseAmellwindHomebrew(), true);
  }, [syncEquipmentCatalogs]);

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
      resolveEquippableFromCart(items, weaponCatalog, armorCatalog);
    setWeapons(nextWeapons);
    setArmors(nextArmors);
    setTrinkets(nextTrinkets);
    setIsSyncing(false);
  }, [items, weaponCatalog, armorCatalog]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const equippableCount = weapons.length + armors.length;

  const getEntryKind = useCallback(
    (entry: CartEntry): CartItemKind =>
      classifyCartEntry(entry, weaponCatalog, armorCatalog),
    [weaponCatalog, armorCatalog],
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

  const addEquipmentBundle = useCallback(
    (entries: CartEntry[]) => {
      if (entries.length === 0) return;
      ensureWeaponCatalogsLoaded();
      setItems((prev) => mergeCartEntries(prev, entries));
    },
    [ensureWeaponCatalogsLoaded],
  );

  const addToInventory = useCallback(
    (entry: CartEntry) => {
      ensureWeaponCatalogsLoaded();
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
    },
    [ensureWeaponCatalogsLoaded],
  );

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
    ensureWeaponCatalogsLoaded();
    setItems((prev) => mergeCartEntries(prev, cartItems));
    clearCart();
  }, [cartItems, clearCart, ensureWeaponCatalogsLoaded]);

  const contextValue = useMemo<BuilderInventoryContextValue>(
    () => ({
      items,
      weapons,
      armors,
      armorCatalog,
      trinkets,
      totalItems,
      equippableCount,
      isSyncing,
      ensureWeaponCatalogsLoaded,
      getEntryKind,
      syncEquipmentCatalogs,
      addToInventory,
      addEquipmentBundle,
      removeFromInventory,
      removeWeaponInventoryBundle,
      removeStartingEquipmentItem,
      clearStartingEquipmentForSource,
      clearInventory,
      purchaseFromCart,
    }),
    [
      items,
      weapons,
      armors,
      armorCatalog,
      trinkets,
      totalItems,
      equippableCount,
      isSyncing,
      ensureWeaponCatalogsLoaded,
      getEntryKind,
      syncEquipmentCatalogs,
      addToInventory,
      addEquipmentBundle,
      removeFromInventory,
      removeWeaponInventoryBundle,
      removeStartingEquipmentItem,
      clearStartingEquipmentForSource,
      clearInventory,
      purchaseFromCart,
    ],
  );

  return (
    <BuilderInventoryContext.Provider value={contextValue}>
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

export function useBuilderInventoryOptional(): BuilderInventoryContextValue | null {
  return useContext(BuilderInventoryContext);
}
