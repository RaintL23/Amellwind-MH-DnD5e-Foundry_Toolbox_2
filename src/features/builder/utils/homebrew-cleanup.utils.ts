import type {
  BuilderFeatSelection,
  EquippedArmor,
  EquippedWeapon,
  Weapon,
} from "@/shared/types";
import { getBackgroundById } from "@/features/backgrounds/services/background.service";
import { getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { getSpeciesById } from "@/features/species/services/species.service";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import type { CharacterSelectionRef } from "@/shared/types";

export function isAmellwindWeapon(weapon: Weapon): boolean {
  return weapon.contentSource !== "dnd";
}

export function stripRunesFromWeapon(
  equipped: EquippedWeapon,
): EquippedWeapon {
  return {
    ...equipped,
    runeSlots: 0,
    runes: [],
    rarity: equipped.weapon.contentSource === "dnd" ? "Standard" : equipped.rarity,
  };
}

export function stripRunesFromArmor(equipped: EquippedArmor): EquippedArmor {
  return {
    ...equipped,
    runeSlots: 0,
    runes: [],
    rarity: "Standard",
  };
}

export function clearAmellwindFeats(
  feats: (BuilderFeatSelection | null)[],
): (BuilderFeatSelection | null)[] {
  return feats.map((feat) => (feat?.source === "amellwind" ? null : feat));
}

export async function isAmellwindSpeciesSelection(
  species: CharacterSelectionRef,
): Promise<boolean> {
  const [mh, dnd] = await Promise.all([
    getSpeciesById(species.id),
    getDndRaceById(species.id),
  ]);
  if (mh && !dnd) return true;
  return !!mh && !species.subraceId;
}

export async function isAmellwindBackgroundSelection(
  background: CharacterSelectionRef,
): Promise<boolean> {
  const [mh, dnd] = await Promise.all([
    getBackgroundById(background.id),
    getDndBackgroundById(background.id),
  ]);
  if (mh && !dnd) return true;
  return !!mh;
}
