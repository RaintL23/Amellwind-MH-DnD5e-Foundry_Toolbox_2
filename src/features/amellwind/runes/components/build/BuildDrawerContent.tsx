import { Gem, ShieldCheck, Sword } from "lucide-react";
import { MaterialEffectSlot, Rune } from "@/shared/types";
import { ItemRarity, getRuneSlotCount } from "../../context/RuneBuildContext";
import { RuleViolation } from "../../utils/build.validation";
import { AccumulatedEffects } from "./AccumulatedEffects";
import { ArtificerSlotsControl } from "./ArtificerSlotsControl";
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
  artificerEnabled: boolean;
  artificerLevel: number;
  artificerBonusSlots: number;
  weaponViolations: RuleViolation[];
  armorViolations: RuleViolation[];
  onWeaponRarityChange: (r: ItemRarity) => void;
  onArmorRarityChange: (r: ItemRarity) => void;
  onArtificerEnabledChange: (enabled: boolean) => void;
  onArtificerLevelChange: (level: number) => void;
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
  artificerEnabled,
  artificerLevel,
  artificerBonusSlots,
  weaponViolations,
  armorViolations,
  onWeaponRarityChange,
  onArmorRarityChange,
  onArtificerEnabledChange,
  onArtificerLevelChange,
}: BuildDrawerContentProps) {
  const weaponSlotCount = getRuneSlotCount(weaponRarity, artificerBonusSlots);
  const armorSlotCount = getRuneSlotCount(armorRarity, artificerBonusSlots);

  return (
    <>
      <ArtificerSlotsControl
        enabled={artificerEnabled}
        level={artificerLevel}
        onEnabledChange={onArtificerEnabledChange}
        onLevelChange={onArtificerLevelChange}
      />

      <div className="border-t border-border/50" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <RaritySelect
            label="Weapon"
            value={weaponRarity}
            onChange={onWeaponRarityChange}
          />
          <span className="text-xs text-muted-foreground">
            {weaponRunes.filter(Boolean).length}/{weaponSlotCount}{" "}
            slots
            {artificerBonusSlots > 0 && (
              <span className="text-amber-500/80">
                {" "}
                (+{artificerBonusSlots} Artificer)
              </span>
            )}
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
            {armorRunes.filter(Boolean).length}/{armorSlotCount}{" "}
            slots
            {artificerBonusSlots > 0 && (
              <span className="text-amber-500/80">
                {" "}
                (+{artificerBonusSlots} Artificer)
              </span>
            )}
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
