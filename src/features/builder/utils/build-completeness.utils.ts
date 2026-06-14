import type {
  AbilityKey,
  BackgroundAsiMode,
  BuilderAsiChoices,
  BuilderFeatSelection,
  BuilderOptionalFeatureSelections,
  CartEntry,
  Class,
  DamageType,
  SkillKey,
  Species,
  StartingEquipmentOffers,
  StartingEquipmentSource,
  Subclass,
} from "@/shared/types";
import type { DndBackground } from "@/shared/types/dnd-background.types";
import type {
  DefenseGrant,
  ExpertiseGrant,
  NamedProficiencyGrant,
  ProficiencySource,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { getPendingDefenseChoiceGrants } from "@/shared/utils/defense-grant.parser";
import { getPendingNamedChoiceGrants } from "@/shared/utils/named-proficiency.parser";
import {
  DEFAULT_ASI_CHOICES,
  getFeatSlotLevels,
  isAsiFeatSelection,
  isSubclassLevelReached,
  toFeatSlot,
  toOptionalOriginFeatSlot,
} from "./builder-class.utils";
import {
  getPendingChoiceGrants,
  getPendingExpertiseGrants,
} from "./compute-character-proficiencies";
import {
  getProgressionPicks,
  resolveOptionalFeatureProgressions,
  toOptionalFeatureSlot,
} from "./class-optional-features.utils";
import type { OptionalFeatureOriginFeatSlot } from "./optional-feature-feat-grants.utils";
import {
  ORIGIN_FEAT_SOURCE_NAME,
  formatInvocationOriginFeatSourceName,
  isInvocationOriginFeatSourceName,
} from "./origin-feat.constants";
import {
  getSpeciesChooseSlots,
  hasBackgroundAsi,
} from "./species-ability-bonuses";
import { skillsFromHigherPriority } from "./skill-choice-hierarchy.utils";
import type { SpellcastingInfo } from "../hooks/useSpellcasting";
import { PACT_SPELL_SLOT } from "./pact-magic.utils";
import type {
  BuildCompletenessIssue,
  BuildCompletenessResult,
} from "./build-completeness.types";

type PendingSkillGrant = ReturnType<typeof getPendingChoiceGrants>[number];

export interface BuildCompletenessInput {
  species: { id: string; name: string } | null;
  background: { id: string; name: string } | null;
  classSelection: { id: string; name: string } | null;
  subclass: { id: string; name: string } | null;
  level: number;
  classData: Class | null;
  subclassData: Subclass | null;
  speciesData: Species | null;
  dndBackground: DndBackground | null;
  speciesOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  featSelections: (BuilderFeatSelection | null)[];
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[];
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  allSkillGrants: SkillProficiencyGrant[];
  allExpertiseGrants: ExpertiseGrant[];
  allToolGrants: NamedProficiencyGrant[];
  allLanguageGrants: NamedProficiencyGrant[];
  allDefenseGrants: DefenseGrant[];
  classSkillChoices: Record<number, SkillKey[]>;
  backgroundSkillChoices: SkillKey[];
  speciesSkillChoices: SkillKey[];
  featSkillChoices: Record<number, SkillKey[]>;
  originFeatSkillChoices: SkillKey[];
  optionalFeatureOriginFeatSkillChoices: Record<number, SkillKey[]>;
  expertiseChoices: Record<string, SkillKey[]>;
  classToolChoices: Record<number, string[]>;
  backgroundToolChoices: string[];
  speciesToolChoices: string[];
  classLanguageChoices: Record<number, string[]>;
  backgroundLanguageChoices: string[];
  speciesLanguageChoices: string[];
  speciesDefenseChoices: Record<number, DamageType[]>;
  speciesAbilityChoices: (AbilityKey | null)[];
  backgroundAsiMode: BackgroundAsiMode | null;
  backgroundAsiPlus2: AbilityKey | null;
  backgroundAsiPlus1: AbilityKey | null;
  useTashaOrigin: boolean;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  mainHand: unknown | null;
  offHand: unknown | null;
  armor: unknown | null;
  equippedShield: unknown | null;
  inventoryItems: CartEntry[];
  spellcasting: SpellcastingInfo | null;
}

function scopedStartingItemId(
  source: StartingEquipmentSource,
  itemId: string,
): string {
  return `${source.type}:${source.id}:${itemId}`;
}

function isSkillPickerComplete(
  grants: PendingSkillGrant[],
  chosen: SkillKey[],
  alreadyGranted: Partial<Record<SkillKey, ProficiencySource[]>>,
): boolean {
  if (!grants.length) return true;
  const totalCount = grants.reduce((acc, grant) => acc + grant.count, 0);
  const effectiveChosen = chosen.filter((skill) => !alreadyGranted[skill]?.length);
  return effectiveChosen.length >= totalCount;
}

function isNamedPickerComplete(
  grants: ReturnType<typeof getPendingNamedChoiceGrants>,
  chosen: string[],
): boolean {
  if (!grants.length) return true;
  const totalCount = grants.reduce((acc, grant) => acc + grant.count, 0);
  return chosen.length >= totalCount;
}

function isDefensePickerComplete(
  grants: ReturnType<typeof getPendingDefenseChoiceGrants>,
  chosen: DamageType[],
): boolean {
  if (!grants.length) return true;
  const totalCount = grants.reduce((acc, grant) => acc + grant.count, 0);
  return chosen.length >= totalCount;
}

function isAsiChoicesComplete(choices: BuilderAsiChoices | undefined): boolean {
  if (!choices) return false;
  if (choices.mode === "plus2") return choices.plus2 !== null;
  return choices.plus1a !== null && choices.plus1b !== null;
}

function collectStartingEquipmentIssues(
  offers: StartingEquipmentOffers | undefined,
  source: StartingEquipmentSource,
  inventoryItems: CartEntry[],
): BuildCompletenessIssue[] {
  if (!offers || !hasStartingEquipmentOffers(offers)) return [];

  const prefix = `${source.type}:${source.id}:`;
  const selectedIds = new Set(
    inventoryItems
      .map((entry) => entry.startingEquipmentId)
      .filter((id): id is string => !!id && id.startsWith(prefix)),
  );

  if (selectedIds.size === 0) {
    return [
      {
        id: `starting-equipment-${source.type}-${source.id}`,
        section: "starting-equipment",
        message: `Choose starting equipment for ${source.name}`,
        slot: source.type === "class" ? "class" : "background",
        highlightKey: source.type,
      },
    ];
  }

  const issues: BuildCompletenessIssue[] = [];
  for (const group of offers.groups) {
    if (!group.options || group.options.length <= 1) continue;

    const hasOptionPick = group.options.some((option) =>
      option.items.some((item) =>
        selectedIds.has(scopedStartingItemId(source, item.id)),
      ),
    );

    if (!hasOptionPick) {
      issues.push({
        id: `starting-equipment-${source.type}-${source.id}-${group.id}`,
        section: "starting-equipment",
        message: `Choose a starting equipment option${group.label ? `: ${group.label}` : ""} (${source.name})`,
        slot: source.type === "class" ? "class" : "background",
        highlightKey: source.type,
      });
    }
  }

  return issues;
}

function hasBuildStarted(input: BuildCompletenessInput): boolean {
  if (
    input.species ||
    input.background ||
    input.classSelection ||
    input.subclass
  ) {
    return true;
  }

  if (
    input.mainHand ||
    input.offHand ||
    input.armor ||
    input.equippedShield ||
    input.inventoryItems.length > 0
  ) {
    return true;
  }

  if (
    input.speciesOriginFeat ||
    input.backgroundOriginFeat ||
    input.featSelections.some(Boolean) ||
    input.optionalFeatureOriginFeats.some(Boolean)
  ) {
    return true;
  }

  if (
    Object.values(input.optionalFeatureSelections).some(
      (picks) => (picks?.length ?? 0) > 0,
    )
  ) {
    return true;
  }

  if (
    input.speciesSkillChoices.length > 0 ||
    input.backgroundSkillChoices.length > 0 ||
    Object.values(input.classSkillChoices).some((choices) => choices.length > 0) ||
    input.originFeatSkillChoices.length > 0 ||
    Object.values(input.featSkillChoices).some((choices) => choices.length > 0) ||
    Object.values(input.optionalFeatureOriginFeatSkillChoices).some(
      (choices) => choices.length > 0,
    )
  ) {
    return true;
  }

  if (
    input.speciesToolChoices.length > 0 ||
    input.backgroundToolChoices.length > 0 ||
    Object.values(input.classToolChoices).some((choices) => choices.length > 0) ||
    input.speciesLanguageChoices.length > 0 ||
    input.backgroundLanguageChoices.length > 0 ||
    Object.values(input.classLanguageChoices).some((choices) => choices.length > 0) ||
    Object.values(input.speciesDefenseChoices).some((choices) => choices.length > 0) ||
    Object.values(input.expertiseChoices).some((choices) => choices.length > 0)
  ) {
    return true;
  }

  if (
    input.speciesAbilityChoices.some(Boolean) ||
    input.backgroundAsiMode ||
    (input.useTashaOrigin && (input.tashaPlus2 || input.tashaPlus1))
  ) {
    return true;
  }

  if (
    input.spellcasting &&
    (input.spellcasting.selectedCantripCount > 0 ||
      input.spellcasting.selectedSpellCount > 0)
  ) {
    return true;
  }

  return false;
}

export function evaluateBuildCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessResult {
  const issues: BuildCompletenessIssue[] = [];

  if (input.classSelection && !input.species) {
    issues.push({
      id: "identity-species",
      section: "identity",
      message: "Choose a species",
      slot: "species",
      highlightKey: "species",
    });
  }

  if (input.classSelection && !input.background) {
    issues.push({
      id: "identity-background",
      section: "identity",
      message: "Choose a background",
      slot: "background",
      highlightKey: "background",
    });
  }

  if (!input.classSelection && (input.species || input.background)) {
    issues.push({
      id: "identity-class",
      section: "identity",
      message: "Choose a class",
      slot: "class",
      highlightKey: "class",
    });
  }

  if (
    input.classData &&
    isSubclassLevelReached(input.classData, input.level) &&
    !input.subclass
  ) {
    issues.push({
      id: "identity-subclass",
      section: "identity",
      message: `Choose a ${input.classData.subclassTitle ?? "subclass"}`,
      slot: "subclass",
      highlightKey: "subclass",
    });
  }

  if (
    input.speciesOriginFeatGrant?.kind === "choose" &&
    !input.speciesOriginFeat &&
    !input.backgroundOriginFeat
  ) {
    issues.push({
      id: "origin-feat",
      section: "feats",
      message: "Choose an origin feat",
      slot: "origin-feat",
      highlightKey: "origin-feat",
    });
  }

  if (input.classSelection) {
    const featSlotLevels = getFeatSlotLevels(
      input.classSelection.name,
      input.level,
    );
    featSlotLevels.forEach((featLevel, index) => {
    const feat = input.featSelections[index];
    if (feat) {
      if (isAsiFeatSelection(feat) && !isAsiChoicesComplete(feat.asiChoices)) {
        issues.push({
          id: `feat-asi-${index}`,
          section: "feats",
          message: `Complete ASI choices for level ${featLevel} feat`,
          slot: toFeatSlot(index),
          highlightKey: toFeatSlot(index),
        });
      }
      return;
    }

    issues.push({
      id: `feat-slot-${index}`,
      section: "feats",
      message: `Choose a feat at level ${featLevel}`,
      slot: toFeatSlot(index),
      highlightKey: toFeatSlot(index),
    });
    });
  }

  input.optionalFeatureOriginFeatSlots.forEach((slotMeta) => {
    if (input.optionalFeatureOriginFeats[slotMeta.slotIndex]) return;
    issues.push({
      id: `opt-origin-feat-${slotMeta.slotIndex}`,
      section: "feats",
      message: `Choose origin feat: ${slotMeta.sourceFeatureName}`,
      slot: toOptionalOriginFeatSlot(slotMeta.slotIndex),
      highlightKey: toOptionalOriginFeatSlot(slotMeta.slotIndex),
    });
  });

  const optionalProgressions = resolveOptionalFeatureProgressions(
    input.classData,
    input.subclassData,
    input.level,
  );
  for (const { progression, slotCount } of optionalProgressions) {
    const picks = getProgressionPicks(input.optionalFeatureSelections, progression.id);
    if (picks.length >= slotCount) continue;
    issues.push({
      id: `optional-feature-${progression.id}`,
      section: "optional-features",
      message: `Choose ${slotCount - picks.length} more ${progression.name.replace(/ Options$/i, "")} option${slotCount - picks.length === 1 ? "" : "s"} (${picks.length}/${slotCount})`,
      slot: toOptionalFeatureSlot(progression.id),
      highlightKey: toOptionalFeatureSlot(progression.id),
    });
  }

  if (input.speciesData) {
    const chooseSlots = getSpeciesChooseSlots(input.speciesData.abilityBonuses ?? []);
    chooseSlots.forEach((slot, index) => {
      if (input.speciesAbilityChoices[index]) return;
      issues.push({
        id: `species-asi-${index}`,
        section: "ability-scores",
        message: `Assign species ability bonus (${slot.amount > 1 ? `+${slot.amount}` : "+1"})`,
        highlightKey: "species-asi",
      });
    });
  }

  if (input.dndBackground && hasBackgroundAsi(input.dndBackground.abilityBonuses)) {
    if (!input.backgroundAsiMode) {
      issues.push({
        id: "background-asi-mode",
        section: "ability-scores",
        message: `Choose background ability score mode (${input.dndBackground.name})`,
        highlightKey: "background-asi",
      });
    } else if (input.backgroundAsiMode === "plus2plus1") {
      if (!input.backgroundAsiPlus2 || !input.backgroundAsiPlus1) {
        issues.push({
          id: "background-asi-assign",
          section: "ability-scores",
          message: "Assign background +2 and +1 ability scores",
          highlightKey: "background-asi",
        });
      }
    }
  }

  if (input.useTashaOrigin) {
    if (!input.tashaPlus2 || !input.tashaPlus1) {
      issues.push({
        id: "tasha-origin",
        section: "ability-scores",
        message: "Assign Tasha's +2 and +1 ability scores",
        highlightKey: "tasha-origin",
      });
    }
  }

  const speciesGrantList = input.allSkillGrants.filter(
    (grant) => grant.source.type === "species",
  );
  const bgGrantList = input.allSkillGrants.filter(
    (grant) => grant.source.type === "background",
  );
  const classGrantList = input.allSkillGrants.filter(
    (grant) => grant.source.type === "class",
  );

  const pendingSkills = getPendingChoiceGrants(input.allSkillGrants);
  const speciesGrants = pendingSkills.filter((grant) => grant.source.type === "species");
  const bgGrants = pendingSkills.filter((grant) => grant.source.type === "background");
  const classGrants = pendingSkills.filter((grant) => grant.source.type === "class");
  const originFeatGrants = pendingSkills.filter(
    (grant) =>
      grant.source.type === "feat" && grant.source.name === ORIGIN_FEAT_SOURCE_NAME,
  );
  const invocationOriginFeatGrants = pendingSkills.filter(
    (grant) =>
      grant.source.type === "feat" &&
      isInvocationOriginFeatSourceName(grant.source.name),
  );
  const classFeatGrants = pendingSkills.filter(
    (grant) =>
      grant.source.type === "feat" &&
      grant.source.name !== ORIGIN_FEAT_SOURCE_NAME &&
      !isInvocationOriginFeatSourceName(grant.source.name),
  );

  const higherThanSpecies = skillsFromHigherPriority(
    "species",
    [],
    [],
    [],
    [],
    [],
    [],
  );
  const higherThanBackground = skillsFromHigherPriority(
    "background",
    speciesGrantList,
    input.speciesSkillChoices,
    [],
    [],
    [],
    [],
  );
  const higherThanClass = skillsFromHigherPriority(
    "class",
    speciesGrantList,
    input.speciesSkillChoices,
    bgGrantList,
    input.backgroundSkillChoices,
    [],
    [],
  );
  const flatClassSkillChoices = Object.values(input.classSkillChoices).flat();
  const higherThanFeat = skillsFromHigherPriority(
    "feat",
    speciesGrantList,
    input.speciesSkillChoices,
    bgGrantList,
    input.backgroundSkillChoices,
    classGrantList,
    flatClassSkillChoices,
  );

  if (
    speciesGrants.length > 0 &&
    !isSkillPickerComplete(
      speciesGrants,
      input.speciesSkillChoices,
      higherThanSpecies,
    )
  ) {
    issues.push({
      id: "skills-species",
      section: "skills",
      message: "Complete species skill choices",
      highlightKey: "species",
    });
  }

  if (
    bgGrants.length > 0 &&
    !isSkillPickerComplete(
      bgGrants,
      input.backgroundSkillChoices,
      higherThanBackground,
    )
  ) {
    issues.push({
      id: "skills-background",
      section: "skills",
      message: "Complete background skill choices",
      highlightKey: "background",
    });
  }

  classGrants.forEach((grant, grantIndex) => {
    if (
      isSkillPickerComplete([grant], input.classSkillChoices[grantIndex] ?? [], higherThanClass)
    ) {
      return;
    }
    issues.push({
      id: `skills-class-${grantIndex}`,
      section: "skills",
      message:
        classGrants.length > 1
          ? `Complete class skill choices (${grantIndex + 1}/${classGrants.length})`
          : "Complete class skill choices",
      highlightKey: `class-${grantIndex}`,
    });
  });

  if (
    originFeatGrants.length > 0 &&
    !isSkillPickerComplete(
      originFeatGrants,
      input.originFeatSkillChoices,
      higherThanFeat,
    )
  ) {
    issues.push({
      id: "skills-origin-feat",
      section: "skills",
      message: "Complete origin feat skill choices",
      highlightKey: "origin-feat",
    });
  }

  input.optionalFeatureOriginFeatSlots.forEach((slotMeta) => {
    const sourceName = formatInvocationOriginFeatSourceName(
      slotMeta.sourceFeatureName,
      slotMeta.duplicateIndex,
    );
    const grants = invocationOriginFeatGrants.filter(
      (grant) => grant.source.name === sourceName,
    );
    if (!grants.length) return;
    const chosen = input.optionalFeatureOriginFeatSkillChoices[slotMeta.slotIndex] ?? [];
    if (isSkillPickerComplete(grants, chosen, higherThanFeat)) return;
    issues.push({
      id: `skills-opt-origin-feat-${slotMeta.slotIndex}`,
      section: "skills",
      message: `Complete skill choices for ${sourceName}`,
      highlightKey: sourceName,
    });
  });

  classFeatGrants.forEach((grant, index) => {
    if (
      isSkillPickerComplete(
        [grant],
        input.featSkillChoices[index] ?? [],
        higherThanFeat,
      )
    ) {
      return;
    }
    issues.push({
      id: `skills-feat-${index}`,
      section: "skills",
      message: `Complete skill choices for feat: ${grant.source.name}`,
      highlightKey: `feat-${index}`,
    });
  });

  getPendingExpertiseGrants(input.allExpertiseGrants).forEach((grant, index) => {
    const grantId = `${grant.source.name}-${index}`;
    const chosen = input.expertiseChoices[grantId] ?? [];
    if (chosen.length >= grant.count) return;
    issues.push({
      id: `expertise-${grantId}`,
      section: "skills",
      message: `Choose ${grant.count - chosen.length} more expertise skill${grant.count - chosen.length === 1 ? "" : "s"} (${grant.source.name})`,
      highlightKey: grantId,
    });
  });

  const pendingTools = getPendingNamedChoiceGrants(input.allToolGrants);
  const pendingToolBySource = {
    species: pendingTools.filter((grant) => grant.source.type === "species"),
    background: pendingTools.filter((grant) => grant.source.type === "background"),
    class: pendingTools.filter((grant) => grant.source.type === "class"),
  };

  if (
    pendingToolBySource.species.length > 0 &&
    !isNamedPickerComplete(pendingToolBySource.species, input.speciesToolChoices)
  ) {
    issues.push({
      id: "tools-species",
      section: "tools",
      message: "Complete species tool proficiencies",
      highlightKey: "species",
    });
  }

  if (
    pendingToolBySource.background.length > 0 &&
    !isNamedPickerComplete(pendingToolBySource.background, input.backgroundToolChoices)
  ) {
    issues.push({
      id: "tools-background",
      section: "tools",
      message: "Complete background tool proficiencies",
      highlightKey: "background",
    });
  }

  pendingToolBySource.class.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.classToolChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `tools-class-${grantIndex}`,
      section: "tools",
      message:
        pendingToolBySource.class.length > 1
          ? `Complete class tool proficiencies (${grantIndex + 1}/${pendingToolBySource.class.length})`
          : "Complete class tool proficiencies",
      highlightKey: `class-${grantIndex}`,
    });
  });

  const pendingLanguages = getPendingNamedChoiceGrants(input.allLanguageGrants);
  const pendingLanguageBySource = {
    species: pendingLanguages.filter((grant) => grant.source.type === "species"),
    background: pendingLanguages.filter((grant) => grant.source.type === "background"),
    class: pendingLanguages.filter((grant) => grant.source.type === "class"),
  };

  if (
    pendingLanguageBySource.species.length > 0 &&
    !isNamedPickerComplete(
      pendingLanguageBySource.species,
      input.speciesLanguageChoices,
    )
  ) {
    issues.push({
      id: "languages-species",
      section: "languages",
      message: "Complete species language choices",
      highlightKey: "species",
    });
  }

  if (
    pendingLanguageBySource.background.length > 0 &&
    !isNamedPickerComplete(
      pendingLanguageBySource.background,
      input.backgroundLanguageChoices,
    )
  ) {
    issues.push({
      id: "languages-background",
      section: "languages",
      message: "Complete background language choices",
      highlightKey: "background",
    });
  }

  pendingLanguageBySource.class.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.classLanguageChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `languages-class-${grantIndex}`,
      section: "languages",
      message:
        pendingLanguageBySource.class.length > 1
          ? `Complete class language choices (${grantIndex + 1}/${pendingLanguageBySource.class.length})`
          : "Complete class language choices",
      highlightKey: `class-${grantIndex}`,
    });
  });

  getPendingDefenseChoiceGrants(input.allDefenseGrants).forEach(
    (grant, grantIndex) => {
      const chosen = input.speciesDefenseChoices[grantIndex] ?? [];
      if (isDefensePickerComplete([grant], chosen)) return;
      issues.push({
        id: `defenses-${grantIndex}`,
        section: "defenses",
        message: `Complete species ${grant.defenseKind} choices`,
        highlightKey: `defense-${grantIndex}`,
      });
    },
  );

  if (input.classData && input.classSelection) {
    issues.push(
      ...collectStartingEquipmentIssues(
        input.classData.startingEquipmentOffers,
        {
          type: "class",
          id: input.classSelection.id,
          name: input.classSelection.name,
        },
        input.inventoryItems,
      ),
    );
  }

  if (input.dndBackground && input.background) {
    issues.push(
      ...collectStartingEquipmentIssues(
        input.dndBackground.startingEquipmentOffers,
        {
          type: "background",
          id: input.background.id,
          name: input.background.name,
        },
        input.inventoryItems,
      ),
    );
  }

  const spellcasting = input.spellcasting;
  if (spellcasting?.isSpellcaster) {
    if (
      spellcasting.cantripCount > 0 &&
      spellcasting.selectedCantripCount < spellcasting.cantripCount
    ) {
      issues.push({
        id: "spells-cantrips",
        section: "spells",
        message: `Choose ${spellcasting.cantripCount - spellcasting.selectedCantripCount} more cantrip${spellcasting.cantripCount - spellcasting.selectedCantripCount === 1 ? "" : "s"} (${spellcasting.selectedCantripCount}/${spellcasting.cantripCount})`,
        slot: "spell-level-0",
        highlightKey: "cantrips",
      });
    }

    if (
      spellcasting.maxPreparedOrKnown > 0 &&
      spellcasting.selectedSpellCount < spellcasting.maxPreparedOrKnown
    ) {
      issues.push({
        id: "spells-prepared",
        section: "spells",
        message: `Choose ${spellcasting.maxPreparedOrKnown - spellcasting.selectedSpellCount} more spell${spellcasting.maxPreparedOrKnown - spellcasting.selectedSpellCount === 1 ? "" : "s"} (${spellcasting.selectedSpellCount}/${spellcasting.maxPreparedOrKnown})`,
        slot: spellcasting.usesUnifiedPactPool
          ? PACT_SPELL_SLOT
          : "spell-level-1",
        highlightKey: "spells",
      });
    }
  }

  const hasStarted = hasBuildStarted(input);
  const filteredIssues = hasStarted ? issues : [];

  return {
    hasStarted,
    issues: filteredIssues,
    shouldBlockExport: hasStarted && filteredIssues.length > 0,
  };
}

export function isAsiSelectionComplete(
  selection: BuilderFeatSelection | null | undefined,
): boolean {
  if (!selection || !isAsiFeatSelection(selection)) return true;
  return isAsiChoicesComplete(selection.asiChoices ?? DEFAULT_ASI_CHOICES);
}
