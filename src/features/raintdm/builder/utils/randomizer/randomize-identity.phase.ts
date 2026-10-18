import { getClassById } from "@/features/dnd/classes/services/class.service";
import {
  getDndRaceById,
} from "@/features/dnd/races/services/dnd-race.service";
import {
  getDndBackgroundById,
} from "@/features/dnd/backgrounds/services/dnd-background.service";
import {
  resolveRpgbotContext,
  resolveSpellGuideKey,
  toRpgbotClassSlug,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { isSubclassLevelReached } from "@/features/raintdm/builder/utils/builder-class.utils";
import { delay } from "@/features/raintdm/builder/utils/randomizer/character-randomizer.utils";
import { pickRandomClass, pickBestSubclass } from "@/features/raintdm/builder/utils/randomizer/class-randomizer.utils";
import {
  applyArchetypeAbilityPriority,
  pickBuildArchetype,
} from "@/features/raintdm/builder/utils/randomizer/build-archetype.utils";
import {
  mergeAmellwindSpeciesForRandomizer,
  pickAmellwindBackground,
  pickAmellwindSpecies,
  pickAmellwindSubspecies,
  pickDndBackground,
  pickDndSpecies,
  pickRandomCharacterName,
} from "@/features/raintdm/builder/utils/randomizer/identity-randomizer.utils";
import {
  abilityModifier,
  buildClassPointBuyScores,
} from "@/features/raintdm/builder/utils/randomizer/ability-randomizer.utils";
import { resolveClassAbilityPriority } from "@/features/raintdm/builder/utils/randomizer/class-ability-priority.utils";
import { pickAllSkillChoices } from "@/features/raintdm/builder/utils/randomizer/skill-randomizer.utils";
import { resolveOriginFeatSelectionForGrant } from "@/features/raintdm/builder/utils/randomizer/feat-randomizer.utils";
import { collectSpeciesTraitsWithCreationChoice } from "@/shared/utils/species-trait-choice.utils";
import type { SpeciesTrait } from "@/shared/types";

function assignRandomSpeciesTraitChoices(
  traits: SpeciesTrait[] | null | undefined,
  setSpeciesTraitChoice: (traitName: string, optionId: string | null) => void,
): void {
  for (const trait of collectSpeciesTraitsWithCreationChoice(traits)) {
    const options = trait.creationChoice?.options ?? [];
    if (options.length === 0) continue;
    const picked = options[Math.floor(Math.random() * options.length)];
    if (picked) setSpeciesTraitChoice(trait.name, picked.id);
  }
}
import {
  collectResolvedNamedItems,
  pickNamedChoicesFromGrants,
} from "@/features/raintdm/builder/utils/randomizer/named-proficiency-randomizer.utils";
import type { AbilityKey, BuilderFeatSelection, DndRace, SkillKey } from "@/shared/types";
import type {
  NamedProficiencyGrant,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import type { AbilityBonus } from "@/shared/types/species.types";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";
import { toSelectionRef as toRef } from "./randomize-context.types";

type AbilityBonusMap = Partial<Record<AbilityKey, number>>;

function addBonus(map: AbilityBonusMap, ability: AbilityKey | null, amount: number): void {
  if (!ability || amount === 0) return;
  map[ability] = (map[ability] ?? 0) + amount;
}

/** Assigns species "choose" bonuses by priority; returns fixed + chosen bonuses. */
function assignSpeciesAbilityChoices(
  bonuses: AbilityBonus[],
  abilityPriority: AbilityKey[],
  setChoice: (index: number, ability: AbilityKey | null) => void,
): AbilityBonusMap {
  const applied: AbilityBonusMap = {};
  let index = 0;
  for (const bonus of bonuses) {
    if (bonus.kind === "fixed") {
      for (const [ability, amount] of Object.entries(bonus.bonuses) as [
        AbilityKey,
        number,
      ][]) {
        addBonus(applied, ability, amount);
      }
      continue;
    }
    if (bonus.kind !== "choose") continue;
    const preferred =
      abilityPriority.find((ability) => bonus.from.includes(ability)) ??
      bonus.from[0] ??
      null;
    setChoice(index, preferred);
    addBonus(applied, preferred, bonus.amount);
    index += 1;
  }
  return applied;
}

/** +2 primary / +1 secondary from the 2024 background; returns the applied bonuses. */
function assignBackgroundAsi(
  bonuses: AbilityBonus[],
  abilityPriority: AbilityKey[],
  setMode: (mode: "plus2plus1" | "plus1each" | null) => void,
  setPlus2: (ability: AbilityKey | null) => void,
  setPlus1: (ability: AbilityKey | null) => void,
): AbilityBonusMap {
  const weighted = bonuses.find((bonus) => bonus.kind === "weightedDistribution");
  if (!weighted || weighted.kind !== "weightedDistribution") return {};

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

  const applied: AbilityBonusMap = {};
  addBonus(applied, primary, 2);
  addBonus(applied, secondary, 1);
  return applied;
}

function mergeBonusMaps(...maps: AbilityBonusMap[]): AbilityBonusMap {
  const merged: AbilityBonusMap = {};
  for (const map of maps) {
    for (const [ability, amount] of Object.entries(map) as [AbilityKey, number][]) {
      addBonus(merged, ability, amount);
    }
  }
  return merged;
}

export interface IdentityPhaseResult {
  speciesName: string;
  backgroundName: string;
}

export async function randomizeClassAndSubclassPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): Promise<boolean> {
  const { preservedLevel, catalogs, setters, rpgbot, lockedClass } = ctx;

  // Locked class: keep it (even a 2014 one picked by hand); never consume the bag.
  const lockedData = lockedClass ? await getClassById(lockedClass.id) : undefined;
  const pickedClass = lockedData ?? pickRandomClass(catalogs.classes);
  if (!pickedClass) return false;

  const classData = (await getClassById(pickedClass.id)) ?? pickedClass;
  const pickedSubclass = pickBestSubclass(
    classData,
    rpgbot.rpgbotData,
    ctx.isAllowedSource,
  );

  setters.setClass(toRef(classData.id, classData.name));
  if (lockedData) setters.setClassLocked(true);
  await delay();

  if (
    pickedSubclass &&
    isSubclassLevelReached(classData, preservedLevel)
  ) {
    setters.setSubclass(toRef(pickedSubclass.id, pickedSubclass.name));
  } else {
    setters.setSubclass(null);
  }
  await delay();

  state.classData = classData;
  state.pickedSubclass = pickedSubclass;
  state.archetype = pickBuildArchetype(classData, pickedSubclass);

  return true;
}

export function randomizeAbilityScoresPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { setters, characterAbilities } = ctx;
  const { classData, pickedSubclass } = state;

  const abilityPriority = applyArchetypeAbilityPriority(
    resolveClassAbilityPriority(classData, pickedSubclass),
    state.archetype,
  );
  setters.setAbilityScoreMethod("pointbuy");
  const abilityScores = buildClassPointBuyScores(abilityPriority);
  setters.setAbilityScores(abilityScores);
  const primaryMod = abilityModifier(
    abilityScores[abilityPriority[0] ?? "cha"] ??
      characterAbilities[abilityPriority[0] ?? "cha"],
  );

  state.abilityPriority = abilityPriority;
  state.abilityScores = abilityScores;
  state.primaryMod = primaryMod;
}

export function buildRpgbotLookupsPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { rpgbot } = ctx;
  const { classData, pickedSubclass } = state;

  const classSlug = toRpgbotClassSlug(classData.name);
  state.speciesLookup = rpgbot.createLookup(
    resolveRpgbotContext({
      className: classData.name,
      guideKey: "class",
      category: "species",
    }),
  );
  state.backgroundLookup = rpgbot.createLookup(
    resolveRpgbotContext({
      className: classData.name,
      guideKey: "class",
      category: "background",
    }),
  );
  state.spellLookup = rpgbot.createLookup(
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
  state.featLookup = rpgbot.createLookup(
    resolveRpgbotContext({
      className: classData.name,
      guideKey: "class",
      category: "feat",
    }),
  );
}

export async function randomizeSpeciesAndBackgroundPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): Promise<IdentityPhaseResult> {
  const {
    useAmellwindHomebrew,
    catalogs,
    setters,
    rpgbot,
  } = ctx;
  const {
    classData,
    abilityPriority,
    speciesLookup,
    backgroundLookup,
  } = state;
  const archetype = state.archetype.archetype;
  // Shared so species → background never repeat a non-repeatable origin feat.
  const usedOriginFeatIds = new Set<string>();
  let speciesBonuses: AbilityBonusMap = {};
  let backgroundBonuses: AbilityBonusMap = {};
  const { resolvedLanguagePool, dndRaces, dndBackgrounds, amellwindSpecies, amellwindBackgrounds, dndFeats } =
    catalogs;

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
  let speciesLanguageGrants: NamedProficiencyGrant[] = [];
  let backgroundLanguageGrants: NamedProficiencyGrant[] = [];
  let speciesOriginFeatGrant: OriginFeatGrant | null = null;
  let backgroundOriginFeatGrant: OriginFeatGrant | null = null;
  let randomizedBackgroundDetail: RandomizerPipelineState["randomizedBackgroundDetail"] =
    null;

  if (useAmellwindHomebrew) {
    const pickedSpecies = pickAmellwindSpecies(
      amellwindSpecies,
      abilityPriority,
    );
    if (pickedSpecies) {
      // Lynian / Wyverian are incomplete without a subspecies.
      const pickedSubspecies = pickAmellwindSubspecies(
        amellwindSpecies,
        pickedSpecies,
      );
      const merged = mergeAmellwindSpeciesForRandomizer(
        pickedSpecies,
        pickedSubspecies,
      );
      speciesName = pickedSubspecies
        ? `${pickedSpecies.name} (${pickedSubspecies.name})`
        : pickedSpecies.name;
      setters.setSpecies({
        id: pickedSpecies.id,
        name: pickedSpecies.name,
        subraceId: pickedSubspecies?.id ?? null,
        subraceName: pickedSubspecies?.name ?? null,
      });
      speciesGrants = merged.skillGrants;
      speciesLanguageGrants = merged.languageGrants;
      speciesOriginFeatGrant = pickedSpecies.originFeatGrant ?? null;
      speciesBonuses = assignSpeciesAbilityChoices(
        merged.abilityBonuses,
        abilityPriority,
        setters.setSpeciesAbilityChoice,
      );
      const speciesSkills = pickAllSkillChoices(
        merged.skillGrants,
        speciesLookup,
      );
      speciesSkillChoices = speciesSkills;
      if (speciesSkills.length > 0) {
        setters.setSpeciesSkillChoices(speciesSkills);
      }
      const speciesLanguages = pickNamedChoicesFromGrants(
        merged.languageGrants,
        new Set(),
        resolvedLanguagePool,
      );
      speciesLanguageChoices = speciesLanguages;
      if (speciesLanguages.length > 0) {
        setters.setSpeciesLanguageChoices(speciesLanguages);
      }
      const speciesWeapons = pickNamedChoicesFromGrants(
        merged.weaponProficiencyGrants,
      );
      if (speciesWeapons.length > 0) {
        setters.setSpeciesWeaponChoices(speciesWeapons);
      }
      const resolvedSpeciesOriginFeat =
        await resolveOriginFeatSelectionForGrant(
          pickedSpecies.originFeatGrant,
          dndFeats,
          rpgbot.rpgbotData,
          classData.name,
          usedOriginFeatIds,
          abilityPriority,
          archetype,
        );
      if (resolvedSpeciesOriginFeat) {
        setters.setSpeciesOriginFeat(resolvedSpeciesOriginFeat);
        speciesOriginFeatSelection = resolvedSpeciesOriginFeat;
        usedOriginFeatIds.add(resolvedSpeciesOriginFeat.id);
      }
      assignRandomSpeciesTraitChoices(
        merged.traits,
        setters.setSpeciesTraitChoice,
      );
    }

    const pickedBackground = pickAmellwindBackground(amellwindBackgrounds);
    if (pickedBackground) {
      backgroundName = pickedBackground.name;
      setters.setBackground(
        toRef(pickedBackground.id, pickedBackground.name),
      );
      randomizedBackgroundDetail = {
        id: pickedBackground.id,
        name: pickedBackground.name,
        startingEquipmentOffers: pickedBackground.startingEquipmentOffers ?? {
          groups: [],
        },
      };
      await delay();

      backgroundGrants = pickedBackground.skillGrants;
      backgroundLanguageGrants = pickedBackground.languageGrants ?? [];
      backgroundOriginFeatGrant =
        pickedBackground.originFeatGrant ?? null;
      const backgroundSkills = pickAllSkillChoices(
        pickedBackground.skillGrants,
        backgroundLookup,
      );
      backgroundSkillChoices = backgroundSkills;
      if (backgroundSkills.length > 0) {
        setters.setBackgroundSkillChoices(backgroundSkills);
      }
      const backgroundTools = pickNamedChoicesFromGrants(
        pickedBackground.toolGrants ?? [],
      );
      if (backgroundTools.length > 0) {
        setters.setBackgroundToolChoices(backgroundTools);
      }
      const backgroundLanguageExclude = collectResolvedNamedItems(
        [...speciesLanguageGrants, ...backgroundLanguageGrants],
        speciesLanguageChoices,
      );
      const backgroundLanguages = pickNamedChoicesFromGrants(
        pickedBackground.languageGrants ?? [],
        backgroundLanguageExclude,
        resolvedLanguagePool,
      );
      backgroundLanguageChoices = backgroundLanguages;
      if (backgroundLanguages.length > 0) {
        setters.setBackgroundLanguageChoices(backgroundLanguages);
      }
      const resolvedBackgroundOriginFeat =
        await resolveOriginFeatSelectionForGrant(
          pickedBackground.originFeatGrant,
          dndFeats,
          rpgbot.rpgbotData,
          classData.name,
          usedOriginFeatIds,
          abilityPriority,
          archetype,
        );
      if (resolvedBackgroundOriginFeat) {
        setters.setBackgroundOriginFeat(resolvedBackgroundOriginFeat);
        backgroundOriginFeatSelection = resolvedBackgroundOriginFeat;
        usedOriginFeatIds.add(resolvedBackgroundOriginFeat.id);
      }
    }
  } else {
    const pickedSpecies = pickDndSpecies(
      dndRaces,
      rpgbot.rpgbotData,
      classData.name,
    );
    if (pickedSpecies) {
      speciesName = pickedSpecies.name;
      setters.setSpecies(toRef(pickedSpecies.id, pickedSpecies.name));
      const speciesDetail = await getDndRaceById(pickedSpecies.id);
      if (speciesDetail) {
        speciesGrants = speciesDetail.skillGrants;
        speciesLanguageGrants = speciesDetail.languageGrants;
        speciesOriginFeatGrant = speciesDetail.originFeatGrant ?? null;
        speciesBonuses = assignSpeciesAbilityChoices(
          speciesDetail.abilityBonuses,
          abilityPriority,
          setters.setSpeciesAbilityChoice,
        );
        const speciesSkills = pickAllSkillChoices(
          speciesDetail.skillGrants,
          speciesLookup,
        );
        speciesSkillChoices = speciesSkills;
        if (speciesSkills.length > 0) {
          setters.setSpeciesSkillChoices(speciesSkills);
        }
        const speciesLanguages = pickNamedChoicesFromGrants(
          speciesDetail.languageGrants,
          new Set(),
          resolvedLanguagePool,
        );
        speciesLanguageChoices = speciesLanguages;
        if (speciesLanguages.length > 0) {
          setters.setSpeciesLanguageChoices(speciesLanguages);
        }
        const speciesWeapons = pickNamedChoicesFromGrants(
          speciesDetail.weaponProficiencyGrants ?? [],
        );
        if (speciesWeapons.length > 0) {
          setters.setSpeciesWeaponChoices(speciesWeapons);
        }
        const resolvedSpeciesOriginFeat = await resolveOriginFeatSelectionForGrant(
          speciesDetail.originFeatGrant,
          dndFeats,
          rpgbot.rpgbotData,
          classData.name,
          usedOriginFeatIds,
          abilityPriority,
          archetype,
        );
        if (resolvedSpeciesOriginFeat) {
          setters.setSpeciesOriginFeat(resolvedSpeciesOriginFeat);
          speciesOriginFeatSelection = resolvedSpeciesOriginFeat;
          usedOriginFeatIds.add(resolvedSpeciesOriginFeat.id);
        }

        if (speciesDetail.namedSpellGroups && speciesDetail.namedSpellGroups.length > 0) {
          const randomIndex = Math.floor(Math.random() * speciesDetail.namedSpellGroups.length);
          const chosenGroup = speciesDetail.namedSpellGroups[randomIndex];
          if (chosenGroup) {
            randomizedSpeciesLineageChoice = chosenGroup.name;
            setters.setSpeciesSpellGroupChoice(chosenGroup.name);
          }
        }
        assignRandomSpeciesTraitChoices(
          speciesDetail.traits,
          setters.setSpeciesTraitChoice,
        );
        randomizedSpeciesDetail = speciesDetail;
      }
    }

    const pickedBackground = pickDndBackground(
      dndBackgrounds,
      rpgbot.rpgbotData,
      classData.name,
      abilityPriority,
    );
    if (pickedBackground) {
      backgroundName = pickedBackground.name;
      setters.setBackground(
        toRef(pickedBackground.id, pickedBackground.name),
      );
      const backgroundDetail = await getDndBackgroundById(
        pickedBackground.id,
      );
      if (backgroundDetail) {
        randomizedBackgroundDetail = backgroundDetail;
        backgroundGrants = backgroundDetail.skillGrants;
        backgroundLanguageGrants = backgroundDetail.languageGrants;
        backgroundOriginFeatGrant =
          backgroundDetail.originFeatGrant ?? null;
        backgroundBonuses = assignBackgroundAsi(
          backgroundDetail.abilityBonuses,
          abilityPriority,
          setters.setBackgroundAsiMode,
          setters.setBackgroundAsiPlus2,
          setters.setBackgroundAsiPlus1,
        );
        const backgroundSkills = pickAllSkillChoices(
          backgroundDetail.skillGrants,
          backgroundLookup,
        );
        backgroundSkillChoices = backgroundSkills;
        if (backgroundSkills.length > 0) {
          setters.setBackgroundSkillChoices(backgroundSkills);
        }
        const backgroundTools = pickNamedChoicesFromGrants(
          backgroundDetail.toolGrants,
        );
        if (backgroundTools.length > 0) {
          setters.setBackgroundToolChoices(backgroundTools);
        }
        const backgroundLanguageExclude = collectResolvedNamedItems(
          [
            ...speciesLanguageGrants,
            ...backgroundDetail.languageGrants,
          ],
          speciesLanguageChoices,
        );
        const backgroundLanguages = pickNamedChoicesFromGrants(
          backgroundDetail.languageGrants,
          backgroundLanguageExclude,
          resolvedLanguagePool,
        );
        backgroundLanguageChoices = backgroundLanguages;
        if (backgroundLanguages.length > 0) {
          setters.setBackgroundLanguageChoices(backgroundLanguages);
        }
        const resolvedBackgroundOriginFeat =
          await resolveOriginFeatSelectionForGrant(
            backgroundDetail.originFeatGrant,
            dndFeats,
            rpgbot.rpgbotData,
            classData.name,
            usedOriginFeatIds,
            abilityPriority,
            archetype,
          );
        if (resolvedBackgroundOriginFeat) {
          setters.setBackgroundOriginFeat(resolvedBackgroundOriginFeat);
          backgroundOriginFeatSelection = resolvedBackgroundOriginFeat;
          usedOriginFeatIds.add(resolvedBackgroundOriginFeat.id);
        }
      }
    }
  }

  state.originAbilityBonuses = mergeBonusMaps(speciesBonuses, backgroundBonuses);
  state.speciesName = speciesName;
  state.backgroundName = backgroundName;
  state.randomizedSpeciesDetail = randomizedSpeciesDetail;
  state.randomizedSpeciesLineageChoice = randomizedSpeciesLineageChoice;
  state.speciesGrants = speciesGrants;
  state.speciesSkillChoices = speciesSkillChoices;
  state.backgroundGrants = backgroundGrants;
  state.backgroundSkillChoices = backgroundSkillChoices;
  state.speciesOriginFeatSelection = speciesOriginFeatSelection;
  state.backgroundOriginFeatSelection = backgroundOriginFeatSelection;
  state.speciesLanguageChoices = speciesLanguageChoices;
  state.backgroundLanguageChoices = backgroundLanguageChoices;
  state.speciesLanguageGrants = speciesLanguageGrants;
  state.backgroundLanguageGrants = backgroundLanguageGrants;
  state.speciesOriginFeatGrant = speciesOriginFeatGrant;
  state.backgroundOriginFeatGrant = backgroundOriginFeatGrant;
  state.randomizedBackgroundDetail = randomizedBackgroundDetail;

  return { speciesName, backgroundName };
}

export async function randomizeCharacterNamePhase(
  ctx: RandomizeCharacterContext,
  speciesName: string,
): Promise<void> {
  ctx.setters.setName(await pickRandomCharacterName(speciesName || null));
  await delay();
}
