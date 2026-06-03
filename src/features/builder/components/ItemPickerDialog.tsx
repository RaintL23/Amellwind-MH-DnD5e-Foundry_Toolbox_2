import { useState, useMemo, useEffect } from "react";
import { Search, Sword, Shield, Shirt } from "lucide-react";
import { BASE_ARMORS, CLOTHING_ARMOR } from "../data/armor.placeholder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { EquipmentSlotType, Weapon, ArmorItem } from "@/shared/types";
import { RarityButtonGroup } from "./RarityButtonGroup";

interface ItemPickerDialogProps {
  open: boolean;
  slot: EquipmentSlotType | null;
  onClose: () => void;
}

export function ItemPickerDialog({ open, slot, onClose }: ItemPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("Common");
  const [allWeapons, setAllWeapons] = useState<Weapon[]>([]);
  const [weaponsLoading, setWeaponsLoading] = useState(false);
  const { equipWeapon, unequipWeapon, equipArmor, unequipArmor, equipTrinket, unequipTrinket, hasIntegratedShield } =
    useCharacterBuilder();
  const { weapons: inventoryWeapons, armors: inventoryArmors } = useBuilderInventory();

  const isWeaponSlot = slot === "mainHand" || slot === "offHand";
  const isArmorSlot = slot === "armor";
  const isTrinketSlot = slot === "trinket1" || slot === "trinket2";

  useEffect(() => {
    if (!open || !isWeaponSlot) return;
    setWeaponsLoading(true);
    getAllWeapons()
      .then(setAllWeapons)
      .finally(() => setWeaponsLoading(false));
  }, [open, isWeaponSlot]);

  const { inventoryWeaponsFiltered, catalogWeaponsFiltered } = useMemo(() => {
    if (!isWeaponSlot) return { inventoryWeaponsFiltered: [], catalogWeaponsFiltered: [] };
    const q = search.toLowerCase();
    const invNames = new Set(inventoryWeapons.map((w) => w.name));
    const matches = (w: Weapon) => w.name.toLowerCase().includes(q);
    return {
      inventoryWeaponsFiltered: inventoryWeapons.filter(matches),
      catalogWeaponsFiltered: allWeapons.filter(
        (w) => matches(w) && !invNames.has(w.name),
      ),
    };
  }, [allWeapons, inventoryWeapons, search, isWeaponSlot]);

  const { inventoryArmorsFiltered, catalogArmorsFiltered } = useMemo(() => {
    if (!isArmorSlot) return { inventoryArmorsFiltered: [], catalogArmorsFiltered: [] };
    const q = search.toLowerCase();
    const invNames = new Set(inventoryArmors.map((a) => a.name));
    const matches = (a: ArmorItem) => a.name.toLowerCase().includes(q);
    return {
      inventoryArmorsFiltered: inventoryArmors.filter(matches),
      catalogArmorsFiltered: BASE_ARMORS.filter(
        (a) => matches(a) && !invNames.has(a.name),
      ),
    };
  }, [inventoryArmors, search, isArmorSlot]);

  const showClothOption = useMemo(() => {
    if (!isArmorSlot) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return ["cloth", "clothing", "robe", "tunic", "caster", "mage", "wizard", "monk"].some(
      (term) => term.includes(q) || q.includes(term),
    );
  }, [isArmorSlot, search]);

  function handleSelectWeapon(weapon: Weapon) {
    if (!slot || !isWeaponSlot) return;
    equipWeapon(slot, weapon, selectedRarity);
    onClose();
    setSearch("");
  }

  function handleSelectArmor(armor: ArmorItem) {
    equipArmor(armor);
    onClose();
    setSearch("");
  }

  function handleSelectTrinket(name: string) {
    if (!slot || !isTrinketSlot) return;
    equipTrinket(slot, name);
    onClose();
    setSearch("");
  }

  function handleUnequip() {
    if (!slot) return;
    if (isWeaponSlot) {
      if (slot === "offHand" && hasIntegratedShield) return;
      unequipWeapon(slot);
    } else if (isArmorSlot) unequipArmor();
    else if (isTrinketSlot) unequipTrinket(slot);
    onClose();
  }

  const title = isWeaponSlot
    ? "Select Weapon"
    : isArmorSlot
      ? "Select Armor"
      : `Select Trinket — ${slot === "trinket1" ? "Slot 1" : "Slot 2"}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Rarity selector for weapons */}
          {isWeaponSlot && (
            <RarityButtonGroup
              value={selectedRarity}
              onChange={setSelectedRarity}
            />
          )}

          {/* Unequip button */}
          <button
            type="button"
            onClick={handleUnequip}
            className="w-full text-left px-3 py-2 rounded-md border border-border/50 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Unequip slot
          </button>

          {/* Item list */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {isWeaponSlot && inventoryWeaponsFiltered.length > 0 && (
              <div className="space-y-1 pb-2 mb-2 border-b border-border">
                <p className="text-[10px] uppercase tracking-wide text-primary font-medium px-1">
                  Inventario (carrito)
                </p>
                {inventoryWeaponsFiltered.map((w) => (
                  <button
                    key={`inv-${w.name}`}
                    type="button"
                    onClick={() => handleSelectWeapon(w)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors border border-primary/20 bg-primary/5"
                  >
                    <Sword className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {w.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {w.dmg1} {w.dmgType} • {w.properties.join(", ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isWeaponSlot &&
              catalogWeaponsFiltered.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => handleSelectWeapon(w)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <Sword className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {w.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {w.dmg1} {w.dmgType} • {w.properties.join(", ")}
                    </div>
                  </div>
                </button>
              ))}

            {isArmorSlot && showClothOption && (
              <div className="space-y-1 pb-2 mb-2 border-b border-border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium px-1">
                  Clothing
                </p>
                <button
                  onClick={() => handleSelectArmor(CLOTHING_ARMOR)}
                  className="w-full text-left flex items-start gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <Shirt className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">Cloth</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      10 + DEX (no armor bonus) • {CLOTHING_ARMOR.rarity} •{" "}
                      {CLOTHING_ARMOR.runeSlots} slot
                    </div>
                    <p className="text-[10px] text-muted-foreground/90 mt-1 leading-relaxed">
                      For barbarians, monks, or spellcasters without armor proficiency
                      (robe, tunic, etc.). Rarity upgrades add material slots like normal
                      armor.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {isArmorSlot && inventoryArmorsFiltered.length > 0 && (
              <div className="space-y-1 pb-2 mb-2 border-b border-border">
                <p className="text-[10px] uppercase tracking-wide text-primary font-medium px-1">
                  Inventario (carrito)
                </p>
                {inventoryArmorsFiltered.map((a) => (
                  <button
                    key={`inv-${a.name}`}
                    type="button"
                    onClick={() => handleSelectArmor(a)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors border border-primary/20 bg-primary/5"
                  >
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {a.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        AC {a.baseAC} • {a.category} • {a.rarity}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isArmorSlot &&
              catalogArmorsFiltered.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => handleSelectArmor(a)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {a.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      AC {a.baseAC} • {a.category} • {a.rarity}
                    </div>
                  </div>
                </button>
              ))}

            {isTrinketSlot && (
              <div className="space-y-1">
                {["Rune Holder A", "Rune Holder B", "Rune Holder C"].map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSelectTrinket(name)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Placeholder</span>
                  </button>
                ))}
              </div>
            )}

            {isWeaponSlot && weaponsLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading weapons...
              </p>
            )}

            {isWeaponSlot &&
              !weaponsLoading &&
              inventoryWeaponsFiltered.length === 0 &&
              catalogWeaponsFiltered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No weapons found.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
