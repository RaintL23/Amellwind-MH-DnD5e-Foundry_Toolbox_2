import { getFeatById } from "@/features/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import type { BuilderFeatSelection } from "@/shared/types";
import type {
  ExpertiseGrant,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import { isAsiFeatSelection } from "./builder-class.utils";
import { ORIGIN_FEAT_SOURCE_NAME } from "./origin-feat.constants";
import { optionalFeatureOriginFeatSourceName } from "./optional-feature-feat-grants.utils";
import type { OptionalFeatureOriginFeatSlot } from "./optional-feature-feat-grants.utils";
import { EMPTY_FEAT_GRANTS } from "./grant-sync.constants";

interface ActiveFeatEntry {
  selection: BuilderFeatSelection;
  isOrigin: boolean;
  classSlotIndex: number | null;
  invocationOriginIndex: number | null;
}

export function buildActiveFeatEntries(
  featSelections: (BuilderFeatSelection | null)[],
  speciesOriginFeat: BuilderFeatSelection | null,
  backgroundOriginFeat: BuilderFeatSelection | null,
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[],
): ActiveFeatEntry[] {
  const classFeatSelections = featSelections
    .filter(Boolean)
    .filter((f) => f && !isAsiFeatSelection(f)) as BuilderFeatSelection[];

  const originFeatSelections = [backgroundOriginFeat, speciesOriginFeat].filter(
    (feat): feat is BuilderFeatSelection => !!feat && !isAsiFeatSelection(feat),
  );

  const activeEntries: ActiveFeatEntry[] = [];

  originFeatSelections.forEach((selection) => {
    activeEntries.push({
      selection,
      isOrigin: true,
      classSlotIndex: null,
      invocationOriginIndex: null,
    });
  });

  optionalFeatureOriginFeats.forEach((selection, invocationOriginIndex) => {
    if (!selection || isAsiFeatSelection(selection)) return;
    activeEntries.push({
      selection,
      isOrigin: false,
      classSlotIndex: null,
      invocationOriginIndex,
    });
  });

  classFeatSelections.forEach((selection, classSlotIndex) => {
    activeEntries.push({
      selection,
      isOrigin: false,
      classSlotIndex,
      invocationOriginIndex: null,
    });
  });

  return activeEntries;
}

export async function loadFeatGrantPayload(
  activeEntries: ActiveFeatEntry[],
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[],
) {
  if (!activeEntries.length) {
    return { payload: EMPTY_FEAT_GRANTS, skillChoiceResets: [] };
  }

  const feats = await Promise.all(
    activeEntries.map(({ selection }) =>
      selection.source === "dnd2014" || selection.source === "dnd2024"
        ? getDndFeatById(selection.id)
        : getFeatById(selection.id),
    ),
  );

  const skillGrants: SkillProficiencyGrant[] = [];
  const expertiseGrants: ExpertiseGrant[] = [];
  const skillChoiceResets: Array<{
    isOrigin: boolean;
    classSlotIndex: number | null;
    invocationOriginIndex: number | null;
  }> = [];

  feats.forEach((feat, i) => {
    if (!feat) return;
    const entry = activeEntries[i];
    const slotMeta =
      entry.invocationOriginIndex !== null
        ? optionalFeatureOriginFeatSlots[entry.invocationOriginIndex]
        : null;
    const sourceName = entry.isOrigin
      ? ORIGIN_FEAT_SOURCE_NAME
      : entry.invocationOriginIndex !== null && slotMeta
        ? optionalFeatureOriginFeatSourceName(slotMeta)
        : `Feat slot ${(entry.classSlotIndex ?? 0) + 1}`;
    const tagSource = {
      type: "feat" as const,
      name: sourceName,
    };

    for (const grant of feat.skillGrants ?? []) {
      skillGrants.push({ ...grant, source: tagSource });
    }
    for (const grant of feat.expertiseGrants ?? []) {
      expertiseGrants.push({ ...grant, source: tagSource });
    }

    if ((feat.skillGrants?.length ?? 0) === 0) {
      skillChoiceResets.push({
        isOrigin: entry.isOrigin,
        classSlotIndex: entry.classSlotIndex,
        invocationOriginIndex: entry.invocationOriginIndex,
      });
    }
  });

  return {
    payload: { source: "feats" as const, skillGrants, expertiseGrants },
    skillChoiceResets,
  };
}
