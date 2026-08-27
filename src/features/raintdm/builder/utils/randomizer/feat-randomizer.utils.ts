import type {
  AbilityKey,
  AbilityScores,
  BuilderFeatSelection,
  Class,
  DndFeat,
} from "@/shared/types";
import type { RpgbotRatingsData } from "@/features/raintdm/builder/data/rpgbot-ratings.types";
import { resolveDndFeatForRef } from "@/features/dnd/feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { getFeatSlotLevels } from "../builder-class.utils";
import { dndFeatToBuilderSelection } from "../origin-feat.constants";
import { isEligibleGeneralFeat } from "../feat-prerequisites.utils";
import { pickByRpgbot, prefer2024Edition } from "./character-randomizer.utils";

function isDnd2024Feat(feat: DndFeat): boolean {
  return (
    feat.source === "XPHB" ||
    feat.basicRules2024 === true ||
    feat.srd52 === true
  );
}

function filterOriginFeats(feats: DndFeat[]): DndFeat[] {
  const origin = prefer2024Edition(feats.filter((feat) => feat.category === "O"));
  return origin.length > 0 ? origin : prefer2024Edition(feats);
}

function pickRandomOriginFeat(
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  excludeIds: ReadonlySet<string> = new Set(),
  abilityPriority: AbilityKey[] = [],
): BuilderFeatSelection | null {
  const pool = filterOriginFeats(feats).filter((feat) => !excludeIds.has(feat.id));
  if (pool.length === 0) return null;

  const classSlug = toRpgbotClassSlug(className);
  const picked = classSlug && rpgbotData
    ? pickByRpgbot(pool, (feat) =>
        findRpgbotRating(
          rpgbotData.byClass,
          { classSlug, guideKey: "class", category: "feat" },
          feat.name,
          feat.source,
          feat.variantSources,
        ),
      )
    : pool[Math.floor(Math.random() * pool.length)];

  return picked
    ? dndFeatToBuilderSelection(picked, {
        randomizeAbilityIncreases: true,
        abilityPriority,
      })
    : null;
}

/** Resolve the builder selection for a species/background origin-feat grant (fixed or choose). */
export async function resolveOriginFeatSelectionForGrant(
  grant: OriginFeatGrant | null | undefined,
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  excludeIds: ReadonlySet<string> = new Set(),
  abilityPriority: AbilityKey[] = [],
): Promise<BuilderFeatSelection | null> {
  if (!grant) return null;

  if (grant.kind === "choose") {
    return pickRandomOriginFeat(
      feats,
      rpgbotData,
      className,
      excludeIds,
      abilityPriority,
    );
  }

  if (grant.kind === "fixed" && grant.featRefs[0]) {
    const feat = await resolveDndFeatForRef(grant.featRefs[0]);
    if (!feat) return null;
    return {
      ...dndFeatToBuilderSelection(feat),
      name: grant.featRefs[0].displayLabel,
    };
  }

  return null;
}

function pickRandomClassFeat(
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  slotLevel: number,
  abilities: Partial<AbilityScores> | AbilityScores,
  excludeIds: ReadonlySet<string> = new Set(),
  abilityPriority: AbilityKey[] = [],
): BuilderFeatSelection | null {
  const eligible = prefer2024Edition(
    feats.filter(
      (feat) =>
        isDnd2024Feat(feat) &&
        isEligibleGeneralFeat(feat, { level: slotLevel, abilities }),
    ),
  );
  if (eligible.length === 0) return null;

  const unique = eligible.filter((feat) => !excludeIds.has(feat.id));
  const pool = unique.length > 0 ? unique : eligible;

  const classSlug = toRpgbotClassSlug(className);
  const picked = classSlug && rpgbotData
    ? pickByRpgbot(pool, (feat) =>
        findRpgbotRating(
          rpgbotData.byClass,
          { classSlug, guideKey: "class", category: "feat" },
          feat.name,
          feat.source,
          feat.variantSources,
        ),
      )
    : pool[Math.floor(Math.random() * pool.length)];

  return picked
    ? dndFeatToBuilderSelection(picked, {
        randomizeAbilityIncreases: true,
        abilityPriority,
      })
    : null;
}

export function buildFeatSelectionsForLevel(
  classData: Class,
  level: number,
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  abilities: Partial<AbilityScores> | AbilityScores = {},
  abilityPriority: AbilityKey[] = [],
): (BuilderFeatSelection | null)[] {
  const slotLevels = getFeatSlotLevels(classData.name, level);
  const usedIds = new Set<string>();
  return slotLevels.map((slotLevel) => {
    const selection = pickRandomClassFeat(
      feats,
      rpgbotData,
      classData.name,
      slotLevel,
      abilities,
      usedIds,
      abilityPriority,
    );
    if (selection) usedIds.add(selection.id);
    return selection;
  });
}
