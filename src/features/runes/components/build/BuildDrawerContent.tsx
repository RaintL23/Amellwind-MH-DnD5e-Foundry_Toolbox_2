import { Gem, ShieldCheck, Sword } from "lucide-react";
import { MaterialEffectSlot, Rune } from "@/shared/types";
import { ItemRarity, RARITY_SLOTS } from "../../context/RuneBuildContext";
import { RuleViolation } from "../../utils/build.validation";
import { AccumulatedEffects } from "./AccumulatedEffects";
import { BuildSection } from "./BuildSection";
import { RaritySelect } from "./RaritySelect";
import { TrinketSlotRow } from "./TrinketSlotRow";

interface BuildDrawerContentProps {
  weaponRarity: ItemRarity;
  armorRarity: ItemRarity;
  weaponRunes: (Rune | null)[];
  armorRunes: (Rune | null)[];
  trinket1Rune: Rune | null;
  trinket2Rune: Rune | null;
  trinket1Kind: MaterialEffectSlot | null;
  trinket2Kind: MaterialEffectSlot | null;
  weaponViolations: RuleViolation[];
  armorViolations: RuleViolation[];
  onWeaponRarityChange: (r: ItemRarity) => void;
  onArmorRarityChange: (r: ItemRarity) => void;
}

export function BuildDrawerContent({
  weaponRarity,
  armorRarity,
  weaponRunes,
  armorRunes,
  trinket1Rune,
  trinket2Rune,
  trinket1Kind,
  trinket2Kind,
  weaponViolations,
  armorViolations,
  onWeaponRarityChange,
  onArmorRarityChange,
}: BuildDrawerContentProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <RaritySelect
            label="Weapon"
            value={weaponRarity}
            onChange={onWeaponRarityChange}
          />
          <span className="text-xs text-muted-foreground">
            {weaponRunes.filter(Boolean).length}/{RARITY_SLOTS[weaponRarity]}{" "}
            slots
          </span>
        </div>
        <BuildSection
          title="Weapon"
          icon={<Sword className="h-3.5 w-3.5" />}
          iconColor="text-orange-400"
          runes={weaponRunes}
          slotType="weapon"
          violations={weaponViolations}
        />
      </div>

      <div className="border-t border-border/50" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <RaritySelect
            label="Armor"
            value={armorRarity}
            onChange={onArmorRarityChange}
          />
          <span className="text-xs text-muted-foreground">
            {armorRunes.filter(Boolean).length}/{RARITY_SLOTS[armorRarity]}{" "}
            slots
          </span>
        </div>
        <BuildSection
          title="Armor"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          iconColor="text-blue-400"
          runes={armorRunes}
          slotType="armor"
          violations={armorViolations}
        />
      </div>

      <div className="border-t border-border/50" />

      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
          <Gem className="h-3.5 w-3.5" />
          Trinkets
        </div>

        <TrinketSlotRow
          label="Trinket 1"
          rune={trinket1Rune}
          kind={trinket1Kind}
          slotType="trinket1"
        />
        <TrinketSlotRow
          label="Trinket 2"
          rune={trinket2Rune}
          kind={trinket2Kind}
          slotType="trinket2"
        />

        <p className="text-xs text-muted-foreground/50 italic">
          Only one trinket active at a time. You can swap them as an action.
        </p>
      </div>

      <div className="border-t border-border/50" />

      <AccumulatedEffects
        weaponRunes={weaponRunes}
        armorRunes={armorRunes}
        trinket1Rune={trinket1Rune}
        trinket2Rune={trinket2Rune}
        trinket1Kind={trinket1Kind}
        trinket2Kind={trinket2Kind}
      />
    </>
  );
}
