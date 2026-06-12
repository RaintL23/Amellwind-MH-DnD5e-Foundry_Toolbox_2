import { useEffect } from "react";
import { getFeatById } from "@/features/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { isAsiFeatSelection } from "@/features/builder/utils/builder-class.utils";
import { ORIGIN_FEAT_SOURCE_NAME } from "@/features/builder/utils/origin-feat.constants";
import { optionalFeatureOriginFeatSourceName } from "@/features/builder/utils/optional-feature-feat-grants.utils";

/** Syncs feat-derived skill/expertise grants whenever feat selections change. */
export function useFeatGrantSync() {
  const {
    featSelections,
    speciesOriginFeat,
    backgroundOriginFeat,
    optionalFeatureOriginFeats,
    optionalFeatureOriginFeatSlots,
    applyIdentityGrants,
    setFeatSkillChoices,
    setOriginFeatSkillChoices,
    setOptionalFeatureOriginFeatSkillChoicesAtIndex,
  } = useCharacterBuilder();

  useEffect(() => {
    const classFeatSelections = featSelections
      .filter(Boolean)
      .filter((f) => f && !isAsiFeatSelection(f)) as import("@/shared/types").BuilderFeatSelection[];

    const originFeatSelections = [backgroundOriginFeat, speciesOriginFeat].filter(
      (feat): feat is import("@/shared/types").BuilderFeatSelection =>
        !!feat && !isAsiFeatSelection(feat),
    );

    const activeEntries: Array<{
      selection: import("@/shared/types").BuilderFeatSelection;
      isOrigin: boolean;
      classSlotIndex: number | null;
      invocationOriginIndex: number | null;
    }> = [];

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

    if (!activeEntries.length) {
      applyIdentityGrants({
        source: "feats",
        skillGrants: [],
        expertiseGrants: [],
      });
      return;
    }

    Promise.all(
      activeEntries.map(({ selection }) =>
        selection.source === "dnd2014" || selection.source === "dnd2024"
          ? getDndFeatById(selection.id)
          : getFeatById(selection.id),
      ),
    ).then((feats) => {
      const skillGrants: import("@/shared/types/proficiency.types").SkillProficiencyGrant[] =
        [];
      const expertiseGrants: import("@/shared/types/proficiency.types").ExpertiseGrant[] =
        [];

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
          if (entry.isOrigin) setOriginFeatSkillChoices([]);
          else if (entry.invocationOriginIndex !== null) {
            setOptionalFeatureOriginFeatSkillChoicesAtIndex(
              entry.invocationOriginIndex,
              [],
            );
          } else if (entry.classSlotIndex !== null) {
            setFeatSkillChoices(entry.classSlotIndex, []);
          }
        }
      });

      applyIdentityGrants({ source: "feats", skillGrants, expertiseGrants });
    });
  }, [
    featSelections,
    speciesOriginFeat,
    backgroundOriginFeat,
    optionalFeatureOriginFeats,
    optionalFeatureOriginFeatSlots,
    applyIdentityGrants,
    setFeatSkillChoices,
    setOriginFeatSkillChoices,
    setOptionalFeatureOriginFeatSkillChoicesAtIndex,
  ]);
}
