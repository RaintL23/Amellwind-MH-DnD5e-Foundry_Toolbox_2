import { getFeatById } from "@/features/amellwind/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd/feats/services/dnd-feat.service";
import { buildActiveFeatEntries } from "@/features/raintdm/builder/utils/feat-grant-sync.utils";
import { pickIndexedNamedChoicesForSource } from "@/features/raintdm/builder/utils/randomizer/named-proficiency-randomizer.utils";
import {
  collectProficiencyEntryLines,
  parseEntriesProficiencyGrants,
} from "@/shared/utils/text-proficiency-grants.parser";
import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import { resolveOptionalFeatureOriginFeatSlots } from "@/features/raintdm/builder/utils/optional-feature-feat-grants.utils";
import {
  buildFeatSelectionsForLevel,
  resolveOriginFeatSelectionForGrant,
} from "@/features/raintdm/builder/utils/randomizer/feat-randomizer.utils";
import { resolveBonusCantripPools } from "@/features/raintdm/builder/utils/cantrip-pools.utils";
import { buildRandomSpellSelections } from "@/features/raintdm/builder/utils/randomizer/spell-randomizer.utils";
import { buildSpeciesLineageSpellSelectionsFromCatalog } from "@/features/raintdm/builder/utils/species-spell-grants.utils";
import { pickPendingSkillGrants } from "@/features/raintdm/builder/utils/randomizer/skill-randomizer.utils";
import type { BuilderFeatSelection, SkillKey } from "@/shared/types";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

export async function randomizeInvocationOriginFeatsPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): Promise<void> {
  const { catalogs, setters, rpgbot } = ctx;
  const {
    classData,
    randomFeatureChoiceSelections,
    speciesOriginFeatSelection,
    backgroundOriginFeatSelection,
  } = state;

  const invocationOriginFeatSlots = resolveOptionalFeatureOriginFeatSlots(
    catalogs.allOptionalFeatures,
    randomFeatureChoiceSelections,
  );
  const usedOriginFeatIds = new Set(
    [speciesOriginFeatSelection, backgroundOriginFeatSelection]
      .filter((feat): feat is BuilderFeatSelection => !!feat)
      .map((feat) => feat.id),
  );
  const invocationOriginFeatBySlot = new Map<number, BuilderFeatSelection>();

  for (const slot of invocationOriginFeatSlots) {
    const selection = await resolveOriginFeatSelectionForGrant(
      slot.grant,
      catalogs.dndFeats,
      rpgbot.rpgbotData,
      classData.name,
      usedOriginFeatIds,
      state.abilityPriority,
    );
    if (!selection) continue;
    setters.setOptionalFeatureOriginFeatAtIndex(slot.slotIndex, selection);
    usedOriginFeatIds.add(selection.id);
    invocationOriginFeatBySlot.set(slot.slotIndex, selection);
  }

  state.invocationOriginFeatSlots = invocationOriginFeatSlots;
  state.invocationOriginFeatBySlot = invocationOriginFeatBySlot;
}

export async function randomizeFeatsAndSpellsPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): Promise<Record<number, SkillKey[]>> {
  const { preservedLevel, characterAbilities, catalogs, setters, rpgbot } = ctx;
  const {
    classData,
    pickedSubclass,
    abilityScores,
    abilityPriority,
    spellLookup,
    featLookup,
    randomFeatureChoiceSelections,
    activeProgressions,
    randomizedSpeciesDetail,
    randomizedSpeciesLineageChoice,
    speciesOriginFeatSelection,
    backgroundOriginFeatSelection,
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
    featSkillExclude,
  } = state;

  setters.clearSpells();
  const activeProgressionsList = activeProgressions.map((r) => r.progression);
  const bonusCantripPools = resolveBonusCantripPools({
    optionalFeatureSelections: randomFeatureChoiceSelections,
    progressions: activeProgressionsList,
    optionalCatalog: catalogs.allOptionalFeatures,
    featCatalog: catalogs.allFeatCatalog,
    classData,
    subclass: pickedSubclass,
    level: preservedLevel,
    speciesOriginFeat: speciesOriginFeatSelection,
    backgroundOriginFeat: backgroundOriginFeatSelection,
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
  });
  const lineageSpells = randomizedSpeciesDetail
    ? buildSpeciesLineageSpellSelectionsFromCatalog(
        {
          universalCantrips: randomizedSpeciesDetail.universalCantrips,
          namedSpellGroups: randomizedSpeciesDetail.namedSpellGroups,
        },
        randomizedSpeciesLineageChoice,
        preservedLevel,
        catalogs.allSpells,
      )
    : [];

  const spellSelections = buildRandomSpellSelections({
    allSpells: catalogs.allSpells,
    classData,
    subclass: pickedSubclass,
    level: preservedLevel,
    abilities: {
      ...characterAbilities,
      ...abilityScores,
    },
    rpgbotLookup: spellLookup,
    bonusCantripPools,
    excludedCantripNames: lineageSpells
      .filter((spell) => spell.level === 0)
      .map((spell) => spell.name),
  });
  for (const [levelKey, spells] of Object.entries(spellSelections)) {
    for (const spell of spells) {
      setters.addSpell(Number(levelKey), spell);
    }
  }

  for (const spell of lineageSpells) {
    setters.addSpell(spell.level, spell);
  }

  const featSelections = buildFeatSelectionsForLevel(
    classData,
    preservedLevel,
    catalogs.dndFeats,
    rpgbot.rpgbotData,
    {
      ...characterAbilities,
      ...abilityScores,
    },
    abilityPriority,
  );
  featSelections.forEach((selection, index) => {
    if (selection) setters.setFeatAtIndex(index, selection);
  });

  const featSkillChoicesMap: Record<number, SkillKey[]> = {};
  const classFeatSkillExclude = new Set(featSkillExclude);

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
      classFeatSkillExclude,
    );
    featSkillChoicesMap[index] = choices;
    setters.setFeatSkillChoices(index, choices);
    for (const skill of choices) classFeatSkillExclude.add(skill);
  }

  const optionalOriginFeats: (BuilderFeatSelection | null)[] = [];
  for (const [slot, selection] of state.invocationOriginFeatBySlot) {
    optionalOriginFeats[slot] = selection;
  }
  const activeFeatEntries = buildActiveFeatEntries(
    featSelections,
    state.speciesOriginFeatSelection,
    state.backgroundOriginFeatSelection,
    optionalOriginFeats,
  );
  const featWeaponGrants: NamedProficiencyGrant[] = [];
  const featToolGrants: NamedProficiencyGrant[] = [];
  for (const entry of activeFeatEntries) {
    const feat =
      entry.selection.source === "dnd2014" || entry.selection.source === "dnd2024"
        ? await getDndFeatById(entry.selection.id)
        : await getFeatById(entry.selection.id);
    if (!feat) continue;
    const parsed = parseEntriesProficiencyGrants(
      collectProficiencyEntryLines(feat.paragraphs, feat.sections),
      { type: "feat", name: feat.name },
    );
    featWeaponGrants.push(...parsed.weaponGrants);
    featToolGrants.push(...parsed.toolGrants);
  }
  const featWeaponPicks = pickIndexedNamedChoicesForSource(featWeaponGrants, "feat");
  for (const [index, choices] of Object.entries(featWeaponPicks)) {
    setters.setFeatWeaponChoicesAtIndex(Number(index), choices);
  }
  const featToolPicks = pickIndexedNamedChoicesForSource(featToolGrants, "feat");
  for (const [index, choices] of Object.entries(featToolPicks)) {
    setters.setFeatToolChoicesAtIndex(Number(index), choices);
  }

  return featSkillChoicesMap;
}
