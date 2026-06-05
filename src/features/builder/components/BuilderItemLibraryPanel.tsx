import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Gem,
  ScrollText,
  Search,
  Shield,
  Shirt,
  Sword,
  Users,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { BASE_ARMORS, CLOTHING_ARMOR } from "../data/armor.placeholder";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { getAllSpecies } from "@/features/species/services/species.service";
import { getAllBackgrounds } from "@/features/backgrounds/services/background.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { ArmorItem, Weapon } from "@/shared/types";
import type { PaperDollSelection } from "../hooks/usePaperDollSelection";
import { BuilderPanel } from "./BuilderPanel";
import { RarityButtonGroup } from "./RarityButtonGroup";

const RARITY_BADGE: Record<string, string> = {
  Uncommon:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  Rare: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  "Very Rare":
    "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  Legendary:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
};

const SLOT_LABELS: Partial<Record<NonNullable<PaperDollSelection>, string>> = {
  species: "Especie",
  background: "Antecedente",
  mainHand: "Mano principal",
  offHand: "Mano secundaria",
  armor: "Armadura",
  trinket1: "Trinket 1",
  trinket2: "Trinket 2",
};

interface BuilderItemLibraryPanelProps {
  selectedSlot: PaperDollSelection;
}

export function BuilderItemLibraryPanel({
  selectedSlot,
}: BuilderItemLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("Common");
  const [allWeapons, setAllWeapons] = useState<Weapon[]>([]);
  const [weaponsLoading, setWeaponsLoading] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityOptions, setIdentityOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const {
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    species,
    background,
    equipWeapon,
    unequipWeapon,
    equipArmor,
    unequipArmor,
    equipTrinket,
    unequipTrinket,
    setSpecies,
    setBackground,
    hasIntegratedShield,
  } = useCharacterBuilder();
  const { weapons: inventoryWeapons, armors: inventoryArmors } =
    useBuilderInventory();

  const isWeaponSlot =
    selectedSlot === "mainHand" || selectedSlot === "offHand";
  const isArmorSlot = selectedSlot === "armor";
  const isTrinketSlot =
    selectedSlot === "trinket1" || selectedSlot === "trinket2";
  const isSpeciesSlot = selectedSlot === "species";
  const isBackgroundSlot = selectedSlot === "background";

  useEffect(() => {
    setSearch("");
  }, [selectedSlot]);

  useEffect(() => {
    if (!isWeaponSlot) return;
    setWeaponsLoading(true);
    getAllWeapons()
      .then(setAllWeapons)
      .finally(() => setWeaponsLoading(false));
  }, [isWeaponSlot, selectedSlot]);

  useEffect(() => {
    if (!isSpeciesSlot && !isBackgroundSlot) return;
    setIdentityLoading(true);
    setIdentityOptions([]);

    const load = isSpeciesSlot
      ? getAllSpecies().then((list) =>
          list.map((s) => ({ id: s.id, name: s.name })),
        )
      : getAllBackgrounds().then((list) =>
          list.map((b) => ({ id: b.id, name: b.name })),
        );

    load.then(setIdentityOptions).finally(() => setIdentityLoading(false));
  }, [isSpeciesSlot, isBackgroundSlot, selectedSlot]);

  const q = search.toLowerCase().trim();

  const inventoryWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];
    return inventoryWeapons.filter((w) => w.name.toLowerCase().includes(q));
  }, [inventoryWeapons, isWeaponSlot, q]);

  const catalogWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];
    const invNames = new Set(inventoryWeapons.map((w) => w.name));
    return allWeapons.filter(
      (w) => w.name.toLowerCase().includes(q) && !invNames.has(w.name),
    );
  }, [allWeapons, inventoryWeapons, isWeaponSlot, q]);

  const inventoryArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    return inventoryArmors.filter((a) => a.name.toLowerCase().includes(q));
  }, [inventoryArmors, isArmorSlot, q]);

  const catalogArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    const invNames = new Set(inventoryArmors.map((a) => a.name));
    return BASE_ARMORS.filter(
      (a) => a.name.toLowerCase().includes(q) && !invNames.has(a.name),
    );
  }, [inventoryArmors, isArmorSlot, q]);

  const showClothOption = useMemo(() => {
    if (!isArmorSlot) return false;
    if (!q) return true;
    return [
      "cloth",
      "clothing",
      "robe",
      "tunic",
      "caster",
      "mage",
      "wizard",
      "monk",
    ].some((term) => term.includes(q) || q.includes(term));
  }, [isArmorSlot, q]);

  const identityFiltered = useMemo(() => {
    if (!isSpeciesSlot && !isBackgroundSlot) return [];
    if (!q) return identityOptions;
    return identityOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [identityOptions, isSpeciesSlot, isBackgroundSlot, q]);

  const equippedWeapon =
    selectedSlot === "mainHand"
      ? mainHand
      : selectedSlot === "offHand"
        ? offHand
        : null;

  const equippedTrinket =
    selectedSlot === "trinket1"
      ? trinket1
      : selectedSlot === "trinket2"
        ? trinket2
        : null;

  const selectedIdentity =
    selectedSlot === "species"
      ? species
      : selectedSlot === "background"
        ? background
        : null;

  function handleSelectWeapon(weapon: Weapon) {
    if (!isWeaponSlot || !selectedSlot) return;
    equipWeapon(selectedSlot, weapon, selectedRarity);
  }

  function handleSelectArmor(item: ArmorItem) {
    equipArmor(item);
  }

  function handleSelectTrinket(name: string) {
    if (!isTrinketSlot || !selectedSlot) return;
    equipTrinket(selectedSlot, name);
  }

  function handleSelectIdentity(id: string, name: string) {
    const ref = { id, name };
    if (isSpeciesSlot) setSpecies(ref);
    else if (isBackgroundSlot) setBackground(ref);
  }

  function handleUnequip() {
    if (!selectedSlot) return;
    if (isWeaponSlot) {
      if (selectedSlot === "offHand" && hasIntegratedShield) return;
      unequipWeapon(selectedSlot);
    } else if (isArmorSlot) unequipArmor();
    else if (isTrinketSlot) unequipTrinket(selectedSlot);
    else if (isSpeciesSlot) setSpecies(null);
    else if (isBackgroundSlot) setBackground(null);
  }

  const canUnequip =
    (isWeaponSlot && equippedWeapon) ||
    (isArmorSlot && armor) ||
    (isTrinketSlot && equippedTrinket) ||
    ((isSpeciesSlot || isBackgroundSlot) && selectedIdentity);

  const panelTitle = selectedSlot
    ? `Library — ${SLOT_LABELS[selectedSlot] ?? selectedSlot}`
    : "Library";

  return (
    <BuilderPanel
      title={panelTitle}
      className="flex max-h-[480px] min-h-[180px] flex-col overflow-hidden"
    >
      {!selectedSlot ? (
        <EmptyState text="Click on an equipment slot to see the available options." />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {isWeaponSlot && (
            <div className="mb-2 shrink-0">
              <RarityButtonGroup
                value={selectedRarity}
                onChange={setSelectedRarity}
              />
            </div>
          )}

          {canUnequip && (
            <button
              type="button"
              onClick={handleUnequip}
              className="mb-2 w-full shrink-0 rounded-md border border-border/50 px-2 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
            >
              Remove from slot
            </button>
          )}

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-1">
            {isWeaponSlot && (
              <WeaponList
                inventory={inventoryWeaponsFiltered}
                catalog={catalogWeaponsFiltered}
                loading={weaponsLoading}
                equipped={equippedWeapon?.weapon.name ?? null}
                onSelect={handleSelectWeapon}
              />
            )}

            {isArmorSlot && (
              <ArmorList
                showCloth={showClothOption}
                inventory={inventoryArmorsFiltered}
                catalog={catalogArmorsFiltered}
                equippedName={armor?.armor.name ?? null}
                onSelect={handleSelectArmor}
              />
            )}

            {isTrinketSlot && (
              <TrinketList
                equippedName={equippedTrinket?.name ?? null}
                onSelect={handleSelectTrinket}
              />
            )}

            {(isSpeciesSlot || isBackgroundSlot) && (
              <IdentityList
                loading={identityLoading}
                options={identityFiltered}
                selectedId={selectedIdentity?.id ?? null}
                icon={
                  isSpeciesSlot ? (
                    <Users className="h-3.5 w-3.5 text-sky-400" />
                  ) : (
                    <ScrollText className="h-3.5 w-3.5 text-violet-400" />
                  )
                }
                onSelect={handleSelectIdentity}
              />
            )}

            {selectedSlot === "class" && (
              <EmptyState text="Class selection will be available soon." />
            )}
          </div>
        </div>
      )}
    </BuilderPanel>
  );
}

function WeaponList({
  inventory,
  catalog,
  loading,
  equipped,
  onSelect,
}: {
  inventory: Weapon[];
  catalog: Weapon[];
  loading: boolean;
  equipped: string | null;
  onSelect: (w: Weapon) => void;
}) {
  if (loading) return <EmptyState text="Cargando armas…" />;
  if (inventory.length === 0 && catalog.length === 0) {
    return <EmptyState text="No weapons available." />;
  }

  return (
    <>
      {inventory.length > 0 && (
        <SectionLabel>Inventario (carrito)</SectionLabel>
      )}
      {inventory.map((w) => (
        <ItemRow
          key={`inv-${w.name}`}
          icon={<Sword className="h-3.5 w-3.5 text-primary" />}
          name={w.name}
          stats={`${w.dmg1} ${w.dmgType} • ${w.properties.join(", ")}`}
          equipped={equipped === w.name}
          onClick={() => onSelect(w)}
        />
      ))}
      {catalog.map((w) => (
        <ItemRow
          key={w.name}
          icon={<Sword className="h-3.5 w-3.5 text-muted-foreground" />}
          name={w.name}
          stats={`${w.dmg1} ${w.dmgType} • ${w.properties.join(", ")}`}
          equipped={equipped === w.name}
          onClick={() => onSelect(w)}
        />
      ))}
    </>
  );
}

function ArmorList({
  showCloth,
  inventory,
  catalog,
  equippedName,
  onSelect,
}: {
  showCloth: boolean;
  inventory: ArmorItem[];
  catalog: ArmorItem[];
  equippedName: string | null;
  onSelect: (a: ArmorItem) => void;
}) {
  return (
    <>
      {showCloth && (
        <>
          <SectionLabel>Clothing</SectionLabel>
          <ItemRow
            icon={<Shirt className="h-3.5 w-3.5 text-violet-400" />}
            name="Cloth"
            stats={`10 + DEX • ${CLOTHING_ARMOR.rarity}`}
            equipped={equippedName === CLOTHING_ARMOR.name}
            onClick={() => onSelect(CLOTHING_ARMOR)}
          />
        </>
      )}
      {inventory.length > 0 && (
        <SectionLabel>Inventario (carrito)</SectionLabel>
      )}
      {inventory.map((a) => (
        <ItemRow
          key={`inv-${a.name}`}
          icon={<Shield className="h-3.5 w-3.5 text-primary" />}
          name={a.name}
          stats={`CA ${a.baseAC} • ${a.category}`}
          rarity={a.rarity}
          equipped={equippedName === a.name}
          onClick={() => onSelect(a)}
        />
      ))}
      {catalog.map((a) => (
        <ItemRow
          key={a.name}
          icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />}
          name={a.name}
          stats={`CA ${a.baseAC} • ${a.category}`}
          rarity={a.rarity}
          equipped={equippedName === a.name}
          onClick={() => onSelect(a)}
        />
      ))}
    </>
  );
}

function TrinketList({
  equippedName,
  onSelect,
}: {
  equippedName: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <>
      {["Rune Holder A", "Rune Holder B", "Rune Holder C"].map((name) => (
        <ItemRow
          key={name}
          icon={<Gem className="h-3.5 w-3.5 text-muted-foreground" />}
          name={name}
          stats="Placeholder"
          equipped={equippedName === name}
          onClick={() => onSelect(name)}
        />
      ))}
    </>
  );
}

function IdentityList({
  loading,
  options,
  selectedId,
  icon,
  onSelect,
}: {
  loading: boolean;
  options: Array<{ id: string; name: string }>;
  selectedId: string | null;
  icon: React.ReactNode;
  onSelect: (id: string, name: string) => void;
}) {
  if (loading) return <EmptyState text="Cargando…" />;
  if (options.length === 0) return <EmptyState text="No results." />;

  return (
    <>
      {options.map((o) => (
        <ItemRow
          key={o.id}
          icon={icon}
          name={o.name}
          stats=""
          equipped={selectedId === o.id}
          onClick={() => onSelect(o.id, o.name)}
        />
      ))}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-primary">
      {children}
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>
  );
}

function ItemRow({
  icon,
  name,
  stats,
  rarity,
  equipped = false,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  stats: string;
  rarity?: string;
  equipped?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50",
        equipped ? "border-violet-400/40 bg-violet-400/5" : "border-border/60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 font-medium text-foreground">
          {icon}
          <span className="truncate">{name}</span>
          {equipped && <Check className="h-3 w-3 shrink-0 text-emerald-400" />}
        </div>
        {stats && (
          <div className="truncate pl-5 text-[11px] text-muted-foreground">
            {stats}
          </div>
        )}
      </div>
      {rarity && RARITY_BADGE[rarity] && (
        <span
          className={cn(
            "ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
            RARITY_BADGE[rarity],
          )}
        >
          {rarity}
        </span>
      )}
    </button>
  );
}
