import type { MaterialEffectSlot, Rune } from "@/shared/types";
import type { Class, Subclass, Weapon } from "@/shared/types";
import { getWeaponProficiencyRule } from "@/features/weapons/data/weapon-proficiencies.data";

export interface RuneCompatibilityContext {
  /** Name of the selected class (e.g. "Fighter"), or null if none. */
  className: string | null;
  /** Whether the character can cast spells (full/half/third caster, or caster subclass). */
  isSpellcaster: boolean;
  /** Name of the equipped MH weapon, or null for non-weapon slots. */
  weaponName: string | null;
  /** Derived weapon-type tags from the equipped weapon (e.g. ["weapon-type:melee", "weapon-type:greatsword"]). */
  weaponTypeTags: string[];
  slotKind: "weapon" | "armor" | "trinket";
}

// Explicit map from MH weapon names to their specific weapon-type tags (beyond melee/ranged).
const WEAPON_NAME_TO_SPECIFIC_TAGS: Record<string, string[]> = {
  "Great Sword": ["weapon-type:greatsword", "weapon-type:bladed"],
  Gunlance: ["weapon-type:gunlance"],
  "Insect Glaive": ["weapon-type:insect-glaive", "weapon-type:bladed"],
  "Charge Blade": ["weapon-type:charge-blade", "weapon-type:bladed"],
  "Switch Axe": ["weapon-type:switchaxe", "weapon-type:bladed"],
  Hammer: ["weapon-type:hammer"],
  Lance: ["weapon-type:lance"],
  Bow: ["weapon-type:bow"],
  Longsword: ["weapon-type:bladed"],
  "Dual Blades": ["weapon-type:bladed"],
  "Accel Axe": ["weapon-type:bladed"],
  "Splint Rapier": ["weapon-type:bladed"],
  "Sword and Shield": ["weapon-type:bladed"],
  "Magnet Spike": ["weapon-type:bladed"],
};

/** Returns true if the character can cast spells — either from their class progression
 *  or from a spellcasting subclass (e.g. Eldritch Knight, Arcane Trickster). */
export function isCharacterSpellcaster(
  classData: Class | null,
  subclassData: Subclass | null,
): boolean {
  if (classData?.casterProgression && classData.casterProgression !== "none") {
    return true;
  }
  if (
    subclassData?.additionalSpells?.some(
      ({ prepared, known, expanded }) =>
        (prepared && Object.keys(prepared).length > 0) ||
        (known && Object.keys(known).length > 0) ||
        (expanded && Object.keys(expanded).length > 0),
    )
  ) {
    return true;
  }
  return false;
}

/** Derives all weapon-type tags that apply to an equipped weapon. */
export function getWeaponTypeTagsForWeapon(weapon: Weapon): string[] {
  const tags: string[] = [];

  const rule = getWeaponProficiencyRule(weapon.name);
  if (rule) {
    tags.push(`weapon-type:${rule.range}`);
  }

  const specificTags = WEAPON_NAME_TO_SPECIFIC_TAGS[weapon.name] ?? [];
  tags.push(...specificTags);

  // Fallback: weapons with slashing damage count as bladed
  if (weapon.dmgType === "S" && !tags.includes("weapon-type:bladed")) {
    tags.push("weapon-type:bladed");
  }

  return [...new Set(tags)];
}

function getEffectTags(rune: Rune, slotKind: "weapon" | "armor" | "trinket"): string[] {
  if (slotKind === "weapon") return rune.weaponTags;
  if (slotKind === "armor") return rune.armorTags;
  return rune.tags;
}

/**
 * Returns a human-readable reason why a rune is ineligible for the character/slot,
 * or null if the rune is fully compatible.
 */
export function getRuneIneligibilityReason(
  rune: Rune,
  ctx: RuneCompatibilityContext,
): string | null {
  const effectTags = getEffectTags(rune, ctx.slotKind);

  for (const tag of effectTags.filter((t) => t.startsWith("class:"))) {
    const requirement = tag.slice("class:".length);
    if (requirement === "spellcaster") {
      if (!ctx.isSpellcaster) {
        return ctx.className === null
          ? "Requires a spellcasting class"
          : "Requires spellcasting ability";
      }
    } else {
      if (ctx.className === null) return "Requires a class selection";
      if (ctx.className.toLowerCase() !== requirement.toLowerCase()) {
        const label = requirement.charAt(0).toUpperCase() + requirement.slice(1);
        return `${label} only`;
      }
    }
  }

  if (ctx.slotKind === "weapon") {
    for (const tag of effectTags.filter((t) => t.startsWith("weapon-type:"))) {
      if (!ctx.weaponTypeTags.includes(tag)) {
        const typeName = tag.slice("weapon-type:".length);
        return `Requires ${typeName} weapon`;
      }
    }
  }

  return null;
}

/**
 * Returns true if every rune bearing this tag is ineligible for the character —
 * used to visually disable a tag button in the catalog grid.
 */
export function isTagFullyIneligible(
  tag: string,
  runes: Rune[],
  ctx: RuneCompatibilityContext,
): boolean {
  const bearing = runes.filter((r) => getEffectTags(r, ctx.slotKind).includes(tag));
  if (bearing.length === 0) return false;
  return bearing.every((r) => getRuneIneligibilityReason(r, ctx) !== null);
}

/**
 * Returns the unique ineligibility reasons across all runes bearing this tag,
 * or null if at least one rune is eligible.
 * Use this to explain to the user why a tag badge is disabled.
 */
export function getTagIneligibilityReasons(
  tag: string,
  runes: Rune[],
  ctx: RuneCompatibilityContext,
): string | null {
  const bearing = runes.filter((r) => getEffectTags(r, ctx.slotKind).includes(tag));
  if (bearing.length === 0) return null;

  const reasons = new Set<string>();
  for (const rune of bearing) {
    const reason = getRuneIneligibilityReason(rune, ctx);
    if (reason === null) return null; // at least one eligible rune → tag is not fully disabled
    reasons.add(reason);
  }

  return Array.from(reasons).join(" · ");
}

/** Returns the slot-specific tags of a rune for display/navigation purposes. */
export function getRuneEffectTags(
  rune: Rune,
  slotKind: "weapon" | "armor" | "trinket",
): string[] {
  return getEffectTags(rune, slotKind);
}

export type TagFilterMode = "and" | "or";

function tagsMatchFilter(
  effectTags: string[],
  selectedTags: string[],
  mode: TagFilterMode,
): boolean {
  if (selectedTags.length === 0) return true;
  return mode === "and"
    ? selectedTags.every((tag) => effectTags.includes(tag))
    : selectedTags.some((tag) => effectTags.includes(tag));
}

/** Which material-effect sides of a rune satisfy the active tag filter. */
export function getMatchingMaterialEffectKinds(
  rune: Rune,
  selectedTags: string[],
  mode: TagFilterMode,
): MaterialEffectSlot[] {
  const kinds: MaterialEffectSlot[] = [];
  if (
    rune.weaponEffect &&
    tagsMatchFilter(rune.weaponTags, selectedTags, mode)
  ) {
    kinds.push("weapon");
  }
  if (rune.armorEffect && tagsMatchFilter(rune.armorTags, selectedTags, mode)) {
    kinds.push("armor");
  }
  return kinds;
}

/** True when the rune matches the tag filter for the current equipment slot. */
export function runeMatchesTagFilter(
  rune: Rune,
  selectedTags: string[],
  mode: TagFilterMode,
  slotKind: "weapon" | "armor" | "trinket",
): boolean {
  if (selectedTags.length === 0) return false;

  if (slotKind === "weapon") {
    return tagsMatchFilter(rune.weaponTags, selectedTags, mode);
  }
  if (slotKind === "armor") {
    return tagsMatchFilter(rune.armorTags, selectedTags, mode);
  }

  return getMatchingMaterialEffectKinds(rune, selectedTags, mode).length > 0;
}

export function getRuneMaterialEffectText(
  rune: Rune,
  kind: MaterialEffectSlot,
): string {
  return (kind === "weapon" ? rune.weaponEffect : rune.armorEffect) ?? "";
}

/** Expands runes into one row per applicable material effect for picker lists. */
export function expandRunesForPicker(
  runes: Rune[],
  slotKind: "weapon" | "armor" | "trinket",
  selectedTags: string[],
  tagFilterMode: TagFilterMode | null,
): Array<{ rune: Rune; materialEffectKind: MaterialEffectSlot }> {
  if (slotKind === "weapon") {
    return runes.map((rune) => ({ rune, materialEffectKind: "weapon" }));
  }
  if (slotKind === "armor") {
    return runes.map((rune) => ({ rune, materialEffectKind: "armor" }));
  }

  if (tagFilterMode && selectedTags.length > 0) {
    return runes.flatMap((rune) =>
      getMatchingMaterialEffectKinds(rune, selectedTags, tagFilterMode).map(
        (materialEffectKind) => ({ rune, materialEffectKind }),
      ),
    );
  }

  return runes.flatMap((rune) => {
    const kinds: MaterialEffectSlot[] = [];
    if (rune.weaponEffect) kinds.push("weapon");
    if (rune.armorEffect) kinds.push("armor");
    return kinds.map((materialEffectKind) => ({ rune, materialEffectKind }));
  });
}
