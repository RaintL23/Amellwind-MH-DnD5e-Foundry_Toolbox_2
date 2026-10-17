/**
 * AGMH trinkets: up to two carried, each with one material slot, but only one
 * trinket's material is active at a time (swapping is an action).
 */
import type { EquippedTrinket, Rune } from "@/shared/types";

export type TrinketSlot = "trinket1" | "trinket2";

/** The active trinket; legacy builds without a flag use the first equipped one. */
export function getActiveTrinket(
  trinket1: EquippedTrinket | null,
  trinket2: EquippedTrinket | null,
): EquippedTrinket | null {
  if (trinket1?.active) return trinket1;
  if (trinket2?.active) return trinket2;
  return trinket1 ?? trinket2;
}

export function getActiveTrinketSlot(
  trinket1: EquippedTrinket | null,
  trinket2: EquippedTrinket | null,
): TrinketSlot | null {
  const active = getActiveTrinket(trinket1, trinket2);
  if (!active) return null;
  return active === trinket1 ? "trinket1" : "trinket2";
}

/** Material half the trinket uses; untagged legacy picks prefer the armor effect. */
export function getTrinketMaterialEffect(
  trinket: EquippedTrinket,
): "weapon" | "armor" | null {
  if (!trinket.rune) return null;
  if (trinket.runeMaterialEffect) return trinket.runeMaterialEffect;
  if (trinket.rune.armorEffect) return "armor";
  return trinket.rune.weaponEffect ? "weapon" : null;
}

/** Effect text of the active trinket's material for the given gear type. */
export function getActiveTrinketEffect(
  trinket1: EquippedTrinket | null,
  trinket2: EquippedTrinket | null,
  kind: "weapon" | "armor",
): { rune: Rune; effect: string } | null {
  const active = getActiveTrinket(trinket1, trinket2);
  if (!active?.rune || getTrinketMaterialEffect(active) !== kind) return null;
  const effect =
    kind === "weapon" ? active.rune.weaponEffect : active.rune.armorEffect;
  return effect ? { rune: active.rune, effect } : null;
}
