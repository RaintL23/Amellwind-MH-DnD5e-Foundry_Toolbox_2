import { useEffect } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { EMPTY_FEAT_GRANTS } from "@/features/builder/utils/grant-sync.constants";
import {
  buildActiveFeatEntries,
  loadFeatGrantPayload,
} from "@/features/builder/utils/feat-grant-sync.utils";

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
    const activeEntries = buildActiveFeatEntries(
      featSelections,
      speciesOriginFeat,
      backgroundOriginFeat,
      optionalFeatureOriginFeats,
    );

    if (!activeEntries.length) {
      applyIdentityGrants(EMPTY_FEAT_GRANTS);
      return;
    }

    let cancelled = false;

    void loadFeatGrantPayload(activeEntries, optionalFeatureOriginFeatSlots).then(
      ({ payload, skillChoiceResets }) => {
        if (cancelled) return;

        for (const reset of skillChoiceResets) {
          if (reset.isOrigin) setOriginFeatSkillChoices([]);
          else if (reset.invocationOriginIndex !== null) {
            setOptionalFeatureOriginFeatSkillChoicesAtIndex(
              reset.invocationOriginIndex,
              [],
            );
          } else if (reset.classSlotIndex !== null) {
            setFeatSkillChoices(reset.classSlotIndex, []);
          }
        }

        applyIdentityGrants(payload);
      },
    );

    return () => {
      cancelled = true;
    };
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
