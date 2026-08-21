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

export function meetsFeatPrerequisiteGroup(
  group: FeatPrerequisiteCheckGroup,
  ctx: FeatPrerequisiteContext,
): boolean {
  if (group.hasUnverifiedRequirements) return false;
  if (group.level != null && ctx.level < group.level) return false;
  return meetsAbilityAlternatives(group, ctx.abilities);
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
