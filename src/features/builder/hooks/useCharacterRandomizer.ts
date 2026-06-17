import { useCallback, useState } from "react";
import type { AbilityKey, CharacterSelectionRef } from "@/shared/types";
import { getListClasses, getClassById } from "@/features/classes/services/class.service";
import { getAllSpecies } from "@/features/species/services/species.service";
import { getAllBackgrounds } from "@/features/backgrounds/services/background.service";
import {
  getBuilderListDndRaces,
  getDndRaceById,
} from "@/features/dnd-races/services/dnd-race.service";
import {
  getDndBackgroundById,
  getListDndBackgrounds,
} from "@/features/dnd-backgrounds/services/dnd-background.service";
import {
  getDndFeatById,
  getListDndFeats,
} from "@/features/dnd-feats/services/dnd-feat.service";
import { getListSpells } from "@/features/spells/services/spell.service";
import {
  resolveRpgbotContext,
  resolveSpellGuideKey,
  toRpgbotClassSlug,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsContext } from "@/features/builder/context/RpgbotRatingsContext";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import { isSubclassLevelReached } from "@/features/builder/utils/builder-class.utils";
import { delay } from "@/features/builder/utils/randomizer/character-randomizer.utils";
import { pickRandomClass, pickBestSubclass } from "@/features/builder/utils/randomizer/class-randomizer.utils";
import {
  pickAmellwindBackground,
  pickAmellwindSpecies,
  pickDndBackground,
  pickDndSpecies,
  pickRandomAlignmentAxes,
  pickRandomCharacterName,
} from "@/features/builder/utils/randomizer/identity-randomizer.utils";
import {
  abilityModifier,
  buildClassPointBuyScores,
} from "@/features/builder/utils/randomizer/ability-randomizer.utils";
import { resolveClassAbilityPriority } from "@/features/builder/utils/randomizer/class-ability-priority.utils";
import { skillsFromHigherPriority } from "@/features/builder/utils/skill-choice-hierarchy.utils";
import {
  alreadyGrantedSkillsForFeatPicker,
  collectProficientSkillsFromChoices,
  pickAllSkillChoices,
  pickExpertiseChoicesForGrants,
  pickIndexedSkillChoices,
  pickPendingSkillGrants,
} from "@/features/builder/utils/randomizer/skill-randomizer.utils";
import { detectExpertiseGrants } from "@/features/builder/utils/expertise-detection.utils";
import { ORIGIN_FEAT_SOURCE_NAME } from "@/features/builder/utils/origin-feat.constants";
import {
  buildFeatSelectionsForLevel,
  resolveOriginFeatSelectionForGrant,
} from "@/features/builder/utils/randomizer/feat-randomizer.utils";
import { buildRandomSpellSelections } from "@/features/builder/utils/randomizer/spell-randomizer.utils";
import { buildRandomStartingEquipmentEntries } from "@/features/builder/utils/randomizer/starting-equipment-randomizer.utils";
import { generateXanatharBackstoryNotes } from "@/features/builder/utils/randomizer/backstory-randomizer.utils";
import { buildSpeciesLineageSpellSelectionsFromCatalog } from "@/features/builder/utils/species-spell-grants.utils";
import {
  collectResolvedNamedItems,
  pickIndexedNamedChoicesForSource,
  pickNamedChoicesFromGrants,
} from "@/features/builder/utils/randomizer/named-proficiency-randomizer.utils";
import { buildClassLanguageGrants } from "@/features/builder/utils/class-language-grants.utils";
import {
  getDnd2024LanguageNames,
  loadChooseableLanguages,
} from "@/shared/data/chooseable-languages";
import type { AbilityBonus } from "@/shared/types/species.types";
import type { BuilderFeatSelection, DndRace, SkillKey } from "@/shared/types";
import type { DndBackground } from "@/shared/types/dnd-background.types";
import type { SkillProficiencyGrant } from "@/shared/types/proficiency.types";

function toSelectionRef(id: string, name: string): CharacterSelectionRef {
  return { id, name, subraceId: null, subraceName: null };
}

function assignSpeciesAbilityChoices(
  bonuses: AbilityBonus[],
  abilityPriority: AbilityKey[],
  setChoice: (index: number, ability: AbilityKey | null) => void,
): void {
  let index = 0;
  for (const bonus of bonuses) {
    if (bonus.kind !== "choose") continue;
    const preferred =
      abilityPriority.find((ability) => bonus.from.includes(ability)) ??
      bonus.from[0] ??
      null;
    setChoice(index, preferred);
    index += 1;
  }
}

function assignBackgroundAsi(
  bonuses: AbilityBonus[],
  abilityPriority: AbilityKey[],
  setMode: (mode: "plus2plus1" | "plus1each" | null) => void,
  setPlus2: (ability: AbilityKey | null) => void,
  setPlus1: (ability: AbilityKey | null) => void,
): void {
  const weighted = bonuses.find((bonus) => bonus.kind === "weightedDistribution");
  if (!weighted || weighted.kind !== "weightedDistribution") return;

  const primary =
    abilityPriority.find((ability) => weighted.from.includes(ability)) ??
    weighted.from[0] ??
    null;
  const secondary =
    abilityPriority.find(
      (ability) => ability !== primary && weighted.from.includes(ability),
    ) ??
    weighted.from.find((ability) => ability !== primary) ??
    null;

  setMode("plus2plus1");
  setPlus2(primary);
  setPlus1(secondary);
}

export function useCharacterRandomizer() {
  const [isRandomizing, setIsRandomizing] = useState(false);
  const { data: rpgbotData, createLookup } = useRpgbotRatingsContext();
  const { addEquipmentBundle } = useBuilderInventory();

  const builder = useCharacterBuilder();
  const {
    character,
    useAmellwindHomebrew,
    resetBuild,
    setLevel,
    setName,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setClass,
    setSubclass,
    setSpecies,
    setBackground,
    setAbilityScores,
    setAbilityScoreMethod,
    setClassSkillChoicesAtIndex,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setSpeciesAbilityChoice,
    setBackgroundAsiMode,
    setBackgroundAsiPlus2,
    setBackgroundAsiPlus1,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setFeatAtIndex,
    addSpell,
    clearSpells,
    setBackstoryNotes,
    setSpeciesSpellGroupChoice,
    setOriginFeatSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setBackgroundToolChoices,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
  } = builder;

  const randomize = useCallback(async () => {
    if (useAmellwindHomebrew || isRandomizing) return;

    setIsRandomizing(true);

    const preservedLevel = character.level;
    const { lawChaos, goodEvil } = pickRandomAlignmentAxes();

    try {
      resetBuild();
      setLevel(preservedLevel);
      setName(pickRandomCharacterName());
      setLawChaosAlignment(lawChaos);
      setGoodEvilAlignment(goodEvil);
      await delay();

      const [
        classes,
        dndRaces,
        dndBackgrounds,
        amellwindSpecies,
        amellwindBackgrounds,
        dndFeats,
        allSpells,
      ] = await Promise.all([
        getListClasses(),
        getBuilderListDndRaces(),
        getListDndBackgrounds(),
        useAmellwindHomebrew ? getAllSpecies() : Promise.resolve([]),
        useAmellwindHomebrew ? getAllBackgrounds() : Promise.resolve([]),
        getListDndFeats(),
        getListSpells(),
        loadChooseableLanguages(),
      ]);

      const dnd2024Languages = getDnd2024LanguageNames();

      const pickedClass = pickRandomClass(classes, rpgbotData);
      if (!pickedClass) return;

      const classData = (await getClassById(pickedClass.id)) ?? pickedClass;
      const pickedSubclass = pickBestSubclass(classData, rpgbotData);

      setClass(toSelectionRef(classData.id, classData.name));
      await delay();

      if (
        pickedSubclass &&
        isSubclassLevelReached(classData, preservedLevel)
      ) {
        setSubclass(toSelectionRef(pickedSubclass.id, pickedSubclass.name));
      } else {
        setSubclass(null);
      }
      await delay();

      const abilityPriority = resolveClassAbilityPriority(
        classData,
        pickedSubclass,
      );
      setAbilityScoreMethod("pointbuy");
      const abilityScores = buildClassPointBuyScores(abilityPriority);
      setAbilityScores(abilityScores);
      const primaryMod = abilityModifier(
        abilityScores[abilityPriority[0] ?? "cha"] ??
          character.abilities[abilityPriority[0] ?? "cha"],
      );

      const classSlug = toRpgbotClassSlug(classData.name);
      const speciesLookup = createLookup(
        resolveRpgbotContext({
          className: classData.name,
          guideKey: "class",
          category: "species",
        }),
      );
      const backgroundLookup = createLookup(
        resolveRpgbotContext({
          className: classData.name,
          guideKey: "class",
          category: "background",
        }),
      );
      const spellLookup = createLookup(
        classSlug
          ? {
              classSlug,
              guideKey: resolveSpellGuideKey(
                classSlug,
                pickedSubclass?.name.toLowerCase().replace(/\s+/g, "-") ?? null,
              ),
              category: "spell",
            }
          : null,
      );
      const featLookup = createLookup(
        resolveRpgbotContext({
          className: classData.name,
          guideKey: "class",
          category: "feat",
        }),
      );

      let speciesName = "";
      let backgroundName = "";
      let randomizedSpeciesDetail: DndRace | null = null;
      let randomizedSpeciesLineageChoice: string | null = null;
      let speciesGrants: SkillProficiencyGrant[] = [];
      let speciesSkillChoices: SkillKey[] = [];
      let backgroundGrants: SkillProficiencyGrant[] = [];
      let backgroundSkillChoices: SkillKey[] = [];
      let speciesOriginFeatSelection: BuilderFeatSelection | null = null;
      let backgroundOriginFeatSelection: BuilderFeatSelection | null = null;
      let speciesLanguageChoices: string[] = [];
      let backgroundLanguageChoices: string[] = [];
      let randomizedBackgroundDetail: DndBackground | null = null;

      if (useAmellwindHomebrew) {
        const pickedSpecies = pickAmellwindSpecies(
          amellwindSpecies,
          abilityPriority,
        );
        if (pickedSpecies) {
          speciesName = pickedSpecies.name;
          setSpecies(toSelectionRef(pickedSpecies.id, pickedSpecies.name));
          assignSpeciesAbilityChoices(
            pickedSpecies.abilityBonuses,
            abilityPriority,
            setSpeciesAbilityChoice,
          );
        }

        const pickedBackground = pickAmellwindBackground(amellwindBackgrounds);
        if (pickedBackground) {
          backgroundName = pickedBackground.name;
          setBackground(
            toSelectionRef(pickedBackground.id, pickedBackground.name),
          );
        }
      } else {
        const pickedSpecies = pickDndSpecies(
          dndRaces,
          rpgbotData,
          classData.name,
        );
        if (pickedSpecies) {
          speciesName = pickedSpecies.name;
          setSpecies(toSelectionRef(pickedSpecies.id, pickedSpecies.name));
          const speciesDetail = await getDndRaceById(pickedSpecies.id);
          if (speciesDetail) {
            speciesGrants = speciesDetail.skillGrants;
            assignSpeciesAbilityChoices(
              speciesDetail.abilityBonuses,
              abilityPriority,
              setSpeciesAbilityChoice,
            );
            const speciesSkills = pickAllSkillChoices(
              speciesDetail.skillGrants,
              speciesLookup,
            );
            speciesSkillChoices = speciesSkills;
            if (speciesSkills.length > 0) {
              setSpeciesSkillChoices(speciesSkills);
            }
            const speciesLanguages = pickNamedChoicesFromGrants(
              speciesDetail.languageGrants,
              new Set(),
              dnd2024Languages,
            );
            speciesLanguageChoices = speciesLanguages;
            if (speciesLanguages.length > 0) {
              setSpeciesLanguageChoices(speciesLanguages);
            }
            const resolvedSpeciesOriginFeat = await resolveOriginFeatSelectionForGrant(
              speciesDetail.originFeatGrant,
              dndFeats,
              rpgbotData,
              classData.name,
            );
            if (resolvedSpeciesOriginFeat) {
              setSpeciesOriginFeat(resolvedSpeciesOriginFeat);
              speciesOriginFeatSelection = resolvedSpeciesOriginFeat;
            }

            // Pick a random lineage (Fiendish Legacy, Gnomish Lineage, etc.)
            if (speciesDetail.namedSpellGroups && speciesDetail.namedSpellGroups.length > 0) {
              const randomIndex = Math.floor(Math.random() * speciesDetail.namedSpellGroups.length);
              const chosenGroup = speciesDetail.namedSpellGroups[randomIndex];
              if (chosenGroup) {
                randomizedSpeciesLineageChoice = chosenGroup.name;
                setSpeciesSpellGroupChoice(chosenGroup.name);
              }
            }
            randomizedSpeciesDetail = speciesDetail;
          }
        }

        const pickedBackground = pickDndBackground(
          dndBackgrounds,
          rpgbotData,
          classData.name,
          abilityPriority,
        );
        if (pickedBackground) {
          backgroundName = pickedBackground.name;
          setBackground(
            toSelectionRef(pickedBackground.id, pickedBackground.name),
          );
          const backgroundDetail = await getDndBackgroundById(
            pickedBackground.id,
          );
          if (backgroundDetail) {
            randomizedBackgroundDetail = backgroundDetail;
            backgroundGrants = backgroundDetail.skillGrants;
            assignBackgroundAsi(
              backgroundDetail.abilityBonuses,
              abilityPriority,
              setBackgroundAsiMode,
              setBackgroundAsiPlus2,
              setBackgroundAsiPlus1,
            );
            const backgroundSkills = pickAllSkillChoices(
              backgroundDetail.skillGrants,
              backgroundLookup,
            );
            backgroundSkillChoices = backgroundSkills;
            if (backgroundSkills.length > 0) {
              setBackgroundSkillChoices(backgroundSkills);
            }
            const backgroundTools = pickNamedChoicesFromGrants(
              backgroundDetail.toolGrants,
            );
            if (backgroundTools.length > 0) {
              setBackgroundToolChoices(backgroundTools);
            }
            const backgroundLanguageExclude = collectResolvedNamedItems(
              [
                ...(randomizedSpeciesDetail?.languageGrants ?? []),
                ...backgroundDetail.languageGrants,
              ],
              speciesLanguageChoices,
            );
            const backgroundLanguages = pickNamedChoicesFromGrants(
              backgroundDetail.languageGrants,
              backgroundLanguageExclude,
              dnd2024Languages,
            );
            backgroundLanguageChoices = backgroundLanguages;
            if (backgroundLanguages.length > 0) {
              setBackgroundLanguageChoices(backgroundLanguages);
            }
            const resolvedBackgroundOriginFeat =
              await resolveOriginFeatSelectionForGrant(
                backgroundDetail.originFeatGrant,
                dndFeats,
                rpgbotData,
                classData.name,
              );
            if (resolvedBackgroundOriginFeat) {
              setBackgroundOriginFeat(resolvedBackgroundOriginFeat);
              backgroundOriginFeatSelection = resolvedBackgroundOriginFeat;
            }
          }
        }
      }

      await delay();

      const languageExclude = collectResolvedNamedItems(
        [
          ...(randomizedSpeciesDetail?.languageGrants ?? []),
          ...(randomizedBackgroundDetail?.languageGrants ?? []),
        ],
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
        dnd2024Languages,
      );
      for (const [index, choices] of Object.entries(classLanguageChoices)) {
        setClassLanguageChoicesAtIndex(Number(index), choices);
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
        setClassSkillChoicesAtIndex(Number(index), choices);
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
          setOriginFeatSkillChoices(originFeatSkillChoices);
        }
      }

      clearSpells();
      const spellSelections = buildRandomSpellSelections({
        allSpells,
        classData,
        subclass: pickedSubclass,
        level: preservedLevel,
        abilities: {
          ...character.abilities,
          ...abilityScores,
        },
        rpgbotLookup: spellLookup,
      });
      for (const [levelKey, spells] of Object.entries(spellSelections)) {
        for (const spell of spells) {
          addSpell(Number(levelKey), spell);
        }
      }

      if (randomizedSpeciesDetail) {
        const lineageSpells = buildSpeciesLineageSpellSelectionsFromCatalog(
          randomizedSpeciesDetail,
          randomizedSpeciesLineageChoice,
          preservedLevel,
          allSpells,
        );
        for (const spell of lineageSpells) {
          addSpell(spell.level, spell);
        }
      }

      const featSelections = buildFeatSelectionsForLevel(
        classData,
        preservedLevel,
        dndFeats,
        rpgbotData,
      );
      featSelections.forEach((selection, index) => {
        if (selection) setFeatAtIndex(index, selection);
      });

      const featSkillChoicesMap: Record<number, SkillKey[]> = {};
      const featSkillExclude = new Set(featPickerExclude);
      for (const skill of originFeatSkillChoices) featSkillExclude.add(skill);

      for (const [index, selection] of featSelections.entries()) {
        if (!selection) continue;
        const feat = await getDndFeatById(selection.id);
        if (!feat) continue;

        const pendingFeatGrants = (feat.skillGrants ?? [])
          .filter((grant) => grant.kind === "choose" || grant.kind === "any")
          .map((grant) => ({
            ...grant,
            source: {
              type: "feat" as const,
              name: `Feat slot ${index + 1}`,
            },
          }));

        if (pendingFeatGrants.length === 0) continue;

        const choices = pickPendingSkillGrants(
          pendingFeatGrants,
          featLookup,
          featSkillExclude,
        );
        featSkillChoicesMap[index] = choices;
        setFeatSkillChoices(index, choices);
        for (const skill of choices) featSkillExclude.add(skill);
      }

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
        setExpertiseChoices(grantId, choices);
      }

      const classEquipment = buildRandomStartingEquipmentEntries(
        classData.startingEquipmentOffers,
        { type: "class", id: classData.id, name: classData.name },
      );
      const backgroundEquipment = randomizedBackgroundDetail
        ? buildRandomStartingEquipmentEntries(
            randomizedBackgroundDetail.startingEquipmentOffers,
            {
              type: "background",
              id: randomizedBackgroundDetail.id,
              name: randomizedBackgroundDetail.name,
            },
          )
        : [];

      if (classEquipment.length > 0 || backgroundEquipment.length > 0) {
        addEquipmentBundle([...classEquipment, ...backgroundEquipment]);
      }

      const backstory = generateXanatharBackstoryNotes({
        raceName: speciesName,
        backgroundName,
        className: classData.name,
        charismaModifier: primaryMod,
      });
      if (backstory) {
        setBackstoryNotes(backstory);
      }
    } finally {
      setIsRandomizing(false);
    }
  }, [
    useAmellwindHomebrew,
    isRandomizing,
    character.level,
    character.abilities,
    resetBuild,
    setLevel,
    setName,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setClass,
    setSubclass,
    setSpecies,
    setBackground,
    setAbilityScores,
    setAbilityScoreMethod,
    setClassSkillChoicesAtIndex,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setSpeciesAbilityChoice,
    setBackgroundAsiMode,
    setBackgroundAsiPlus2,
    setBackgroundAsiPlus1,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setFeatAtIndex,
    addSpell,
    clearSpells,
    setBackstoryNotes,
    setSpeciesSpellGroupChoice,
    setOriginFeatSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setBackgroundToolChoices,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
    rpgbotData,
    createLookup,
    addEquipmentBundle,
  ]);

  return {
    randomize,
    isRandomizing,
    canRandomize: !useAmellwindHomebrew,
  };
}
