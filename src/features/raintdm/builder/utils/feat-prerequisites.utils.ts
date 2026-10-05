import { isFightingStyleFeat } from "@/features/dnd/feats/utils/dnd-feat-list-filters";
import type {
  AbilityKey,
  AbilityScores,
  DndFeat,
  Feat,
  FeatPrerequisiteCheckGroup,
} from "@/shared/types";

export interface FeatPrerequisiteContext {
  /** Character (or feat-slot unlock) level used for level gates. */
  level: number;
  abilities: Partial<AbilityScores> | AbilityScores;
  /**
   * When set, branches that require Spellcasting or Pact Magic are enforced.
   * Omit to skip that check (randomizer still rejects unverified branches).
   */
  hasSpellcasting?: boolean;
  /**
   * When set, armor and shield proficiency requirements are enforced.
   * Labels are compared case-insensitively ("Medium" matches "medium").
   */
  armorProficiencies?: readonly string[];
}

function scoreOf(
  abilities: FeatPrerequisiteContext["abilities"],
  ability: AbilityKey,
): number {
  return abilities[ability] ?? 0;
}

function meetsAbilityAlternatives(
  group: FeatPrerequisiteCheckGroup,
  abilities: FeatPrerequisiteContext["abilities"],
): boolean {
  if (group.abilityAlternatives.length === 0) return true;
  return group.abilityAlternatives.some((alt) =>
    alt.every((req) => scoreOf(abilities, req.ability) >= req.min),
  );
}

function armorProficiencyCovers(
  owned: readonly string[],
  required: string,
): boolean {
  const needle = required.trim().toLowerCase();
  if (!needle) return true;
  return owned.some((item) => {
    const key = item.trim().toLowerCase();
    if (key === needle || key === `${needle} armor`) return true;
    if (needle === "shield") return key === "shield" || key === "shields";
    return false;
  });
}

function meetsKnownFeatExtras(
  group: FeatPrerequisiteCheckGroup,
  ctx: FeatPrerequisiteContext,
): boolean {
  if (group.requiresSpellcasting && ctx.hasSpellcasting === false) return false;
  if (group.requiredArmor?.length && ctx.armorProficiencies) {
    return group.requiredArmor.every((req) =>
      armorProficiencyCovers(ctx.armorProficiencies ?? [], req),
    );
  }
  return true;
}

export function meetsFeatPrerequisiteGroup(
  group: FeatPrerequisiteCheckGroup,
  ctx: FeatPrerequisiteContext,
  options?: { allowUnverified?: boolean },
): boolean {
  if (group.hasUnverifiedRequirements && !options?.allowUnverified) return false;
  if (group.level != null && ctx.level < group.level) return false;
  if (!meetsAbilityAlternatives(group, ctx.abilities)) return false;
  if (options?.allowUnverified && !meetsKnownFeatExtras(group, ctx)) return false;
  return true;
}

/** True when the character meets at least one OR-branch (or has no prereqs). */
export function meetsFeatPrerequisites(
  feat: Pick<Feat, "prerequisiteCheckGroups">,
  ctx: FeatPrerequisiteContext,
): boolean {
  const groups = feat.prerequisiteCheckGroups ?? [];
  if (groups.length === 0) return true;
  return groups.some((group) => meetsFeatPrerequisiteGroup(group, ctx));
}

/**
 * Level, ability, spellcasting, and armor/shield gates.
 * Species, campaign, and other requirements the builder cannot verify
 * do not hide the feat when the checks above pass.
 */
export function meetsCheckableFeatPrerequisites(
  feat: Pick<Feat, "prerequisiteCheckGroups">,
  ctx: FeatPrerequisiteContext,
): boolean {
  const groups = feat.prerequisiteCheckGroups ?? [];
  if (groups.length === 0) return true;
  return groups.some((group) =>
    meetsFeatPrerequisiteGroup(group, ctx, { allowUnverified: true }),
  );
}

/**
 * Categories valid for ASI / general feat slots (not Origin or Fighting Style).
 * Epic Boons (EB) are included; level prereqs still gate them.
 */
export function isGeneralFeatSlotCategory(
  feat: Pick<DndFeat, "category" | "isOriginFeat">,
): boolean {
  if (feat.isOriginFeat) return false;
  if (isFightingStyleFeat(feat)) return false;
  const cat = feat.category?.toUpperCase() ?? "";
  if (!cat || cat === "G" || cat === "EB") return true;
  // Dragonmarks and other specialty categories stay out of the random ASI pool.
  return false;
}

export function isEligibleGeneralFeat(
  feat: DndFeat,
  ctx: FeatPrerequisiteContext,
): boolean {
  return isGeneralFeatSlotCategory(feat) && meetsFeatPrerequisites(feat, ctx);
}

/**
 * General / Epic Boon feats the picker may offer for one ASI slot.
 * `ctx.level` is the slot unlock level (4, 8, 12, 16, 19, …), not a later character level.
 */
export function isSelectableGeneralFeat(
  feat: DndFeat,
  ctx: FeatPrerequisiteContext,
): boolean {
  return (
    isGeneralFeatSlotCategory(feat) &&
    meetsCheckableFeatPrerequisites(feat, ctx)
  );
}
