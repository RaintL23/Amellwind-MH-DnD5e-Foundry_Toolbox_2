import type {
  BuilderSpellSelections,
  Class,
  Spell,
  Subclass,
  AbilityScores,
} from "@/shared/types";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { isPactMagicClass } from "../builder-class.utils";
import { getPactMagicProgression } from "../pact-magic.utils";
import {
  resolveSubclassSpells,
  spellMatchesCharacterSpellList,
  type CharacterSpellListContext,
} from "../subclass-spells.utils";
import { pickByRpgbot, pickMultipleByRpgbot } from "./character-randomizer.utils";
import { filterSpellsForClassFit } from "./spell-class-fit.utils";
import { isDamageSpell } from "../spell-damage.utils";

import { spellToSelection } from "../spell-selection.utils";

function getCantripCount(classData: Class, level: number): number {
  const rowIndex = level - 1;
  return classData.cantripProgression?.[rowIndex] ?? 0;
}

function getMaxSpellsKnown(classData: Class, level: number): number {
  const rowIndex = level - 1;
  if (classData.spellsKnownProgressionFixed?.length) {
    return classData.spellsKnownProgressionFixed[rowIndex] ?? 0;
  }
  if (classData.preparedSpellsProgression?.length) {
    return classData.preparedSpellsProgression[rowIndex] ?? 0;
  }
  return 0;
}

function buildSpellListContext(
  classData: Class,
  subclass: Subclass | null,
  level: number,
  selectedSpellLevel: number,
  availableSpellSlotLevels: number[],
  isPactPool: boolean,
  spellcastingFromSubclass: boolean,
): CharacterSpellListContext {
  const subclassSpells = resolveSubclassSpells(subclass, level);
  return {
    className: classData.name,
    subclassName: subclass?.name ?? null,
    subclassShortName: subclass?.shortName ?? null,
    expandedFilters: subclassSpells.expandedFilters,
    characterLevel: level,
    availableSpellSlotLevels,
    selectedSpellLevel,
    isPactPool,
    spellcastingFromSubclass,
  };
}

function filterEligibleSpells(
  allSpells: Spell[],
  ctx: CharacterSpellListContext,
  spellLevel: number,
  classData: Class,
  subclass: Subclass | null,
): Spell[] {
  const eligible = allSpells.filter(
    (spell) =>
      spell.level === spellLevel &&
      spellMatchesCharacterSpellList(spell, {
        ...ctx,
        selectedSpellLevel: spellLevel,
      }),
  );
  return filterSpellsForClassFit(eligible, classData, subclass);
}

function toBuilderSelections(
  rawSelections: Record<number, Spell[]>,
): BuilderSpellSelections {
  const selections: BuilderSpellSelections = {};
  for (const [levelKey, spells] of Object.entries(rawSelections)) {
    if (spells.length > 0) {
      selections[Number(levelKey)] = spells.map(spellToSelection);
    }
  }
  return selections;
}

function ensureAtLeastOneDamageSpell(
  selections: Record<number, Spell[]>,
  eligiblePools: Spell[][],
  rpgbotLookup: RpgbotLookupFn | null,
): void {
  const flat: Array<{ level: number; indexInBucket: number; spell: Spell }> = [];
  for (const [levelKey, spells] of Object.entries(selections)) {
    const level = Number(levelKey);
    spells.forEach((spell, indexInBucket) => {
      flat.push({ level, indexInBucket, spell });
    });
  }

  if (flat.length === 0 || flat.some(({ spell }) => isDamageSpell(spell))) return;

  const pickedIds = new Set(flat.map(({ spell }) => spell.id));
  const allEligible = [
    ...new Map(eligiblePools.flat().map((spell) => [spell.id, spell])).values(),
  ];
  const representedLevels = new Set(flat.map(({ level }) => level));
  const getRating = (spell: Spell) =>
    rpgbotLookup?.(spell.name, spell.source) ?? null;

  for (let i = flat.length - 1; i >= 0; i--) {
    const { level, indexInBucket } = flat[i];
    const sameLevelCandidates = allEligible.filter(
      (spell) =>
        isDamageSpell(spell) &&
        spell.level === level &&
        !pickedIds.has(spell.id),
    );
    const replacement = pickByRpgbot(sameLevelCandidates, getRating);
    if (!replacement) continue;

    selections[level]![indexInBucket] = replacement;
    return;
  }

  const crossLevelCandidates = allEligible.filter(
    (spell) =>
      isDamageSpell(spell) &&
      representedLevels.has(spell.level) &&
      !pickedIds.has(spell.id),
  );
  const replacement = pickByRpgbot(crossLevelCandidates, getRating);
  if (!replacement) return;

  const { level, indexInBucket } = flat[flat.length - 1]!;
  selections[level]!.splice(indexInBucket, 1);
  if (selections[level]!.length === 0) delete selections[level];
  selections[replacement.level] = [
    ...(selections[replacement.level] ?? []),
    replacement,
  ];
}

export function buildRandomSpellSelections(params: {
  allSpells: Spell[];
  classData: Class;
  subclass: Subclass | null;
  level: number;
  abilities: AbilityScores;
  rpgbotLookup: RpgbotLookupFn | null;
}): BuilderSpellSelections {
  const { allSpells, classData, subclass, level, rpgbotLookup } = params;
  const rawSelections: Record<number, Spell[]> = {};
  const eligiblePools: Spell[][] = [];

  if (!classData.casterProgression || classData.casterProgression === "none") {
    if (!subclass?.casterProgression) return {};
  }

  const rowIndex = level - 1;
  const isPact = isPactMagicClass(classData);
  const spellcastingFromSubclass = !!(
    !classData.casterProgression ||
    classData.casterProgression === "none"
  );

  let availableSpellSlotLevels: number[] = [];
  if (isPact) {
    const pact =
      getPactMagicProgression(classData.spellProgression, rowIndex) ?? null;
    if (pact?.pactSlotLevel) {
      availableSpellSlotLevels = [pact.pactSlotLevel];
    }
  } else {
    for (let spellLevel = 1; spellLevel <= 9; spellLevel++) {
      if (spellLevel <= Math.ceil(level / 2)) {
        availableSpellSlotLevels.push(spellLevel);
      }
    }
  }

  const cantripCount = isPact
    ? (getPactMagicProgression(classData.spellProgression, rowIndex)
        ?.cantripCount ?? getCantripCount(classData, level))
    : getCantripCount(classData, level);

  if (cantripCount > 0) {
    const ctx = buildSpellListContext(
      classData,
      subclass,
      level,
      0,
      availableSpellSlotLevels,
      isPact,
      spellcastingFromSubclass,
    );
    const cantrips = filterEligibleSpells(
      allSpells,
      ctx,
      0,
      classData,
      subclass,
    );
    eligiblePools.push(cantrips);
    const picked = pickMultipleByRpgbot(
      cantrips,
      cantripCount,
      (spell) => rpgbotLookup?.(spell.name, spell.source) ?? null,
    );
    if (picked.length > 0) {
      rawSelections[0] = picked;
    }
  }

  const maxSpells = isPact
    ? (getPactMagicProgression(classData.spellProgression, rowIndex)
        ?.preparedSpellCount ?? getMaxSpellsKnown(classData, level))
    : getMaxSpellsKnown(classData, level);

  if (maxSpells <= 0) {
    ensureAtLeastOneDamageSpell(rawSelections, eligiblePools, rpgbotLookup);
    return toBuilderSelections(rawSelections);
  }

  if (isPact) {
    const ctx = buildSpellListContext(
      classData,
      subclass,
      level,
      availableSpellSlotLevels[0] ?? 1,
      availableSpellSlotLevels,
      true,
      spellcastingFromSubclass,
    );
    const pool = filterSpellsForClassFit(
      allSpells.filter(
        (spell) =>
          spell.level > 0 &&
          spell.level <= (availableSpellSlotLevels[0] ?? 1) &&
          spellMatchesCharacterSpellList(spell, {
            ...ctx,
            selectedSpellLevel: spell.level,
            isPactPool: true,
          }),
      ),
      classData,
      subclass,
    );
    eligiblePools.push(pool);
    const picked = pickMultipleByRpgbot(
      pool,
      maxSpells,
      (spell) => rpgbotLookup?.(spell.name, spell.source) ?? null,
    );
    for (const spell of picked) {
      const bucket = rawSelections[spell.level] ?? [];
      rawSelections[spell.level] = [...bucket, spell];
    }
    ensureAtLeastOneDamageSpell(rawSelections, eligiblePools, rpgbotLookup);
    return toBuilderSelections(rawSelections);
  }

  let remaining = maxSpells;
  for (const spellLevel of availableSpellSlotLevels) {
    if (remaining <= 0) break;
    const ctx = buildSpellListContext(
      classData,
      subclass,
      level,
      spellLevel,
      availableSpellSlotLevels,
      false,
      spellcastingFromSubclass,
    );
    const pool = filterEligibleSpells(
      allSpells,
      ctx,
      spellLevel,
      classData,
      subclass,
    );
    eligiblePools.push(pool);
    const perLevel = Math.max(1, Math.ceil(remaining / availableSpellSlotLevels.length));
    const picked = pickMultipleByRpgbot(
      pool,
      Math.min(perLevel, remaining),
      (spell) => rpgbotLookup?.(spell.name, spell.source) ?? null,
    );
    if (picked.length > 0) {
      rawSelections[spellLevel] = picked;
      remaining -= picked.length;
    }
  }

  ensureAtLeastOneDamageSpell(rawSelections, eligiblePools, rpgbotLookup);
  return toBuilderSelections(rawSelections);
}
