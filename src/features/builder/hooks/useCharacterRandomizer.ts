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
import { getListDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";
import { getListSpells } from "@/features/spells/services/spell.service";
import {
  resolveRpgbotContext,
  resolveSpellGuideKey,
  toRpgbotClassSlug,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsContext } from "@/features/builder/context/RpgbotRatingsContext";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import { parseAlignmentAxes } from "@/features/builder/utils/alignment.utils";
import { isSubclassLevelReached } from "@/features/builder/utils/builder-class.utils";
import { delay } from "@/features/builder/utils/randomizer/character-randomizer.utils";
import { pickRandomClass, pickBestSubclass } from "@/features/builder/utils/randomizer/class-randomizer.utils";
import {
  pickAmellwindBackground,
  pickAmellwindSpecies,
  pickDndBackground,
  pickDndSpecies,
} from "@/features/builder/utils/randomizer/identity-randomizer.utils";
import {
  abilityModifier,
  rollAndAssignAbilityScores,
} from "@/features/builder/utils/randomizer/ability-randomizer.utils";
import {
  pickIndexedSkillChoices,
  pickAllSkillChoices,
} from "@/features/builder/utils/randomizer/skill-randomizer.utils";
import {
  buildFeatSelectionsForLevel,
  pickRandomOriginFeat,
} from "@/features/builder/utils/randomizer/feat-randomizer.utils";
import { buildRandomSpellSelections } from "@/features/builder/utils/randomizer/spell-randomizer.utils";
import { buildRandomStartingEquipmentEntries } from "@/features/builder/utils/randomizer/starting-equipment-randomizer.utils";
import { generateXanatharBackstoryNotes } from "@/features/builder/utils/randomizer/backstory-randomizer.utils";
import type { AbilityBonus } from "@/shared/types/species.types";

function toSelectionRef(id: string, name: string): CharacterSelectionRef {
  return { id, name, subraceId: null, subraceName: null };
}

function assignSpeciesAbilityChoices(
  bonuses: AbilityBonus[],
  saveProficiencies: AbilityKey[],
  setChoice: (index: number, ability: AbilityKey | null) => void,
): void {
  let index = 0;
  for (const bonus of bonuses) {
    if (bonus.kind !== "choose") continue;
    const preferred =
      saveProficiencies.find((ability) => bonus.from.includes(ability)) ??
      bonus.from[0] ??
      null;
    setChoice(index, preferred);
    index += 1;
  }
}

function assignBackgroundAsi(
  bonuses: AbilityBonus[],
  saveProficiencies: AbilityKey[],
  setMode: (mode: "plus2plus1" | "plus1each" | null) => void,
  setPlus2: (ability: AbilityKey | null) => void,
  setPlus1: (ability: AbilityKey | null) => void,
): void {
  const weighted = bonuses.find((bonus) => bonus.kind === "weightedDistribution");
  if (!weighted || weighted.kind !== "weightedDistribution") return;

  const primary = saveProficiencies[0] ?? weighted.from[0] ?? null;
  const secondary =
    saveProficiencies.find((ability) => ability !== primary) ??
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
  } = builder;

  const randomize = useCallback(async () => {
    if (useAmellwindHomebrew || isRandomizing) return;

    setIsRandomizing(true);

    const preservedLevel = character.level;
    const preservedName = character.name;
    const { lawChaos, goodEvil } = parseAlignmentAxes(character.alignment);

    try {
      resetBuild();
      setLevel(preservedLevel);
      if (preservedName) setName(preservedName);
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
      ]);

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

      const abilityScores = rollAndAssignAbilityScores(
        classData.saveProficiencies,
      );
      setAbilityScores(abilityScores);
      const chaMod = abilityModifier(abilityScores.cha ?? character.abilities.cha);

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

      if (useAmellwindHomebrew) {
        const pickedSpecies = pickAmellwindSpecies(
          amellwindSpecies,
          classData.saveProficiencies,
        );
        if (pickedSpecies) {
          speciesName = pickedSpecies.name;
          setSpecies(toSelectionRef(pickedSpecies.id, pickedSpecies.name));
          assignSpeciesAbilityChoices(
            pickedSpecies.abilityBonuses,
            classData.saveProficiencies,
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
            assignSpeciesAbilityChoices(
              speciesDetail.abilityBonuses,
              classData.saveProficiencies,
              setSpeciesAbilityChoice,
            );
            const speciesSkills = pickAllSkillChoices(
              speciesDetail.skillGrants,
              speciesLookup,
            );
            if (speciesSkills.length > 0) {
              setSpeciesSkillChoices(speciesSkills);
            }
            const originFeat = pickRandomOriginFeat(
              dndFeats,
              rpgbotData,
              classData.name,
            );
            if (originFeat && speciesDetail.originFeatGrant?.kind === "choose") {
              setSpeciesOriginFeat(originFeat);
            }
          }
        }

        const pickedBackground = pickDndBackground(
          dndBackgrounds,
          rpgbotData,
          classData.name,
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
            assignBackgroundAsi(
              backgroundDetail.abilityBonuses,
              classData.saveProficiencies,
              setBackgroundAsiMode,
              setBackgroundAsiPlus2,
              setBackgroundAsiPlus1,
            );
            const backgroundSkills = pickAllSkillChoices(
              backgroundDetail.skillGrants,
              backgroundLookup,
            );
            if (backgroundSkills.length > 0) {
              setBackgroundSkillChoices(backgroundSkills);
            }
            const originFeat = pickRandomOriginFeat(
              dndFeats,
              rpgbotData,
              classData.name,
            );
            if (
              originFeat &&
              backgroundDetail.originFeatGrant?.kind === "choose"
            ) {
              setBackgroundOriginFeat(originFeat);
            }
          }
        }
      }

      await delay();

      const classSkillChoices = pickIndexedSkillChoices(
        classData.skillChoiceGrants,
        featLookup,
      );
      for (const [index, choices] of Object.entries(classSkillChoices)) {
        setClassSkillChoicesAtIndex(Number(index), choices);
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

      const featSelections = buildFeatSelectionsForLevel(
        classData,
        preservedLevel,
        dndFeats,
        rpgbotData,
      );
      featSelections.forEach((selection, index) => {
        if (selection) setFeatAtIndex(index, selection);
      });

      const classEquipment = buildRandomStartingEquipmentEntries(
        classData.startingEquipmentOffers,
        { type: "class", id: classData.id, name: classData.name },
      );
      const backgroundDetail = backgroundName
        ? await getDndBackgroundById(
            builder.background?.id ??
              dndBackgrounds.find((bg) => bg.name === backgroundName)?.id ??
              "",
          )
        : undefined;
      const backgroundEquipment = backgroundDetail
        ? buildRandomStartingEquipmentEntries(
            backgroundDetail.startingEquipmentOffers,
            {
              type: "background",
              id: backgroundDetail.id,
              name: backgroundDetail.name,
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
        charismaModifier: chaMod,
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
    character.name,
    character.alignment,
    character.abilities,
    builder.background?.id,
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
