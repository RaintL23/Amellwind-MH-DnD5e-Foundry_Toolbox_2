import { getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import { skillsFromHigherPriority } from "@/features/builder/utils/skill-choice-hierarchy.utils";
import {
  alreadyGrantedSkillsForFeatPicker,
  pickIndexedSkillChoices,
  pickPendingSkillGrants,
} from "@/features/builder/utils/randomizer/skill-randomizer.utils";
import { buildClassLanguageGrants } from "@/features/builder/utils/class-language-grants.utils";
import {
  collectResolvedNamedItems,
  pickIndexedNamedChoicesForSource,
} from "@/features/builder/utils/randomizer/named-proficiency-randomizer.utils";
import {
  ORIGIN_FEAT_SOURCE_NAME,
  formatInvocationOriginFeatSourceName,
} from "@/features/builder/utils/origin-feat.constants";
import { detectExpertiseGrants } from "@/features/builder/utils/expertise-detection.utils";
import {
  collectProficientSkillsFromChoices,
  pickExpertiseChoicesForGrants,
} from "@/features/builder/utils/randomizer/skill-randomizer.utils";
import type { BuilderFeatSelection, SkillKey } from "@/shared/types";
import type { SkillProficiencyGrant } from "@/shared/types/proficiency.types";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

export async function randomizeProficienciesPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): Promise<void> {
  const { preservedLevel, catalogs, setters } = ctx;
  const {
    classData,
    pickedSubclass,
    speciesGrants,
    speciesSkillChoices,
    backgroundGrants,
    backgroundSkillChoices,
    speciesLanguageGrants,
    backgroundLanguageGrants,
    speciesLanguageChoices,
    backgroundLanguageChoices,
    backgroundOriginFeatSelection,
    speciesOriginFeatSelection,
    invocationOriginFeatSlots,
    invocationOriginFeatBySlot,
    featLookup,
  } = state;
  const { resolvedLanguagePool } = catalogs;

  const languageExclude = collectResolvedNamedItems(
    [...speciesLanguageGrants, ...backgroundLanguageGrants],
    [...speciesLanguageChoices, ...backgroundLanguageChoices],
  );
  const classLanguageGrants = buildClassLanguageGrants(
    classData,
    preservedLevel,
    pickedSubclass,
  );
  const classLanguageChoices = pickIndexedNamedChoicesForSource(
    classLanguageGrants,
    "class",
    languageExclude,
    resolvedLanguagePool,
  );
  for (const [index, choices] of Object.entries(classLanguageChoices)) {
    setters.setClassLanguageChoicesAtIndex(Number(index), choices);
  }

  const higherThanClass = skillsFromHigherPriority(
    "class",
    speciesGrants,
    speciesSkillChoices,
    backgroundGrants,
    backgroundSkillChoices,
    [],
    [],
  );
  const alreadyGrantedClassSkills = new Set(
    Object.keys(higherThanClass) as SkillKey[],
  );
  const classSkillExclude = new Set<SkillKey>([
    ...speciesSkillChoices,
    ...backgroundSkillChoices,
    ...alreadyGrantedClassSkills,
  ]);
  const classSkillChoices = pickIndexedSkillChoices(
    classData.skillChoiceGrants,
    featLookup,
    classSkillExclude,
    alreadyGrantedClassSkills,
  );
  for (const [index, choices] of Object.entries(classSkillChoices)) {
    setters.setClassSkillChoicesAtIndex(Number(index), choices);
  }

  const flatClassSkillChoices = Object.values(classSkillChoices).flat();
  const featPickerExclude = alreadyGrantedSkillsForFeatPicker(
    speciesGrants,
    speciesSkillChoices,
    backgroundGrants,
    backgroundSkillChoices,
    classData.skillChoiceGrants,
    flatClassSkillChoices,
  );

  let originFeatSkillChoices: SkillKey[] = [];
  const activeOriginFeats = [
    backgroundOriginFeatSelection,
    speciesOriginFeatSelection,
  ].filter((feat): feat is BuilderFeatSelection => !!feat);

  if (activeOriginFeats.length > 0) {
    const pendingOriginFeatGrants: Array<
      Extract<SkillProficiencyGrant, { kind: "choose" | "any" }>
    > = [];

    for (const selection of activeOriginFeats) {
      const feat = await getDndFeatById(selection.id);
      if (!feat) continue;
      for (const grant of feat.skillGrants ?? []) {
        if (grant.kind === "choose" || grant.kind === "any") {
          pendingOriginFeatGrants.push({
            ...grant,
            source: { type: "feat", name: ORIGIN_FEAT_SOURCE_NAME },
          });
        }
      }
    }

    if (pendingOriginFeatGrants.length > 0) {
      originFeatSkillChoices = pickPendingSkillGrants(
        pendingOriginFeatGrants,
        featLookup,
        featPickerExclude,
      );
      setters.setOriginFeatSkillChoices(originFeatSkillChoices);
    }
  }

  const featSkillExclude = new Set(featPickerExclude);
  for (const skill of originFeatSkillChoices) featSkillExclude.add(skill);

  for (const slotMeta of invocationOriginFeatSlots) {
    const selection = invocationOriginFeatBySlot.get(slotMeta.slotIndex);
    if (!selection) continue;

    const feat = await getDndFeatById(selection.id);
    if (!feat) continue;

    const sourceName = formatInvocationOriginFeatSourceName(
      slotMeta.sourceFeatureName,
      slotMeta.duplicateIndex,
    );
    const pendingInvocationGrants = (feat.skillGrants ?? [])
      .filter((grant) => grant.kind === "choose" || grant.kind === "any")
      .map((grant) => ({
        ...grant,
        source: { type: "feat" as const, name: sourceName },
      }));

    if (pendingInvocationGrants.length === 0) continue;

    const choices = pickPendingSkillGrants(
      pendingInvocationGrants,
      featLookup,
      featSkillExclude,
    );
    setters.setOptionalFeatureOriginFeatSkillChoicesAtIndex(
      slotMeta.slotIndex,
      choices,
    );
    for (const skill of choices) featSkillExclude.add(skill);
  }

  state.originFeatSkillChoices = originFeatSkillChoices;
  state.featSkillExclude = featSkillExclude;
  state.classSkillChoices = classSkillChoices;
}

export function randomizeExpertisePhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
  featSkillChoicesMap: Record<number, SkillKey[]>,
): void {
  const { preservedLevel, setters } = ctx;
  const {
    classData,
    speciesGrants,
    speciesSkillChoices,
    backgroundGrants,
    backgroundSkillChoices,
    classSkillChoices,
    originFeatSkillChoices,
  } = state;

  const expertiseGrants = detectExpertiseGrants(classData, preservedLevel);
  const proficientSkills = collectProficientSkillsFromChoices({
    speciesGrants,
    speciesChoices: speciesSkillChoices,
    backgroundGrants,
    backgroundChoices: backgroundSkillChoices,
    classGrants: classData.skillChoiceGrants,
    classChoices: classSkillChoices,
    originFeatChoices: originFeatSkillChoices,
    featChoices: featSkillChoicesMap,
  });
  const expertiseChoices = pickExpertiseChoicesForGrants(
    expertiseGrants,
    proficientSkills,
  );
  for (const [grantId, choices] of Object.entries(expertiseChoices)) {
    setters.setExpertiseChoices(grantId, choices);
  }
}
