import type {
  BuilderFeatSelection,
  DndFeat,
  Class,
} from "@/shared/types";
import type { RpgbotRatingsData } from "@/features/builder/data/rpgbot-ratings.types";
import { resolveDndFeatForRef } from "@/features/dnd-feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { getFeatSlotLevels } from "../builder-class.utils";
import { dndFeatToBuilderSelection } from "../origin-feat.utils";
import { pickByRpgbot, prefer2024Edition } from "./character-randomizer.utils";

function isDnd2024Feat(feat: DndFeat): boolean {
  return (
    feat.source === "XPHB" ||
    feat.basicRules2024 === true ||
    feat.srd52 === true
  );
}

export function filterOriginFeats(feats: DndFeat[]): DndFeat[] {
  const origin = prefer2024Edition(feats.filter((feat) => feat.category === "O"));
  return origin.length > 0 ? origin : prefer2024Edition(feats);
}

export function pickRandomOriginFeat(
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
): BuilderFeatSelection | null {
  const pool = filterOriginFeats(feats);
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

  return picked ? dndFeatToBuilderSelection(picked) : null;
}

/** Resolve the builder selection for a species/background origin-feat grant (fixed or choose). */
export async function resolveOriginFeatSelectionForGrant(
  grant: OriginFeatGrant | null | undefined,
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
): Promise<BuilderFeatSelection | null> {
  if (!grant) return null;

  if (grant.kind === "choose") {
    return pickRandomOriginFeat(feats, rpgbotData, className);
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

export function pickRandomClassFeat(
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
): BuilderFeatSelection | null {
  const pool = prefer2024Edition(
    feats.filter((feat) => isDnd2024Feat(feat) && feat.category !== "O"),
  );
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

  return picked ? dndFeatToBuilderSelection(picked) : null;
}

export function buildFeatSelectionsForLevel(
  classData: Class,
  level: number,
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
): (BuilderFeatSelection | null)[] {
  const slotLevels = getFeatSlotLevels(classData.name, level);
  return slotLevels.map(() =>
    pickRandomClassFeat(feats, rpgbotData, classData.name),
  );
}
