import type {
  BuilderSpellSelection,
  BuilderSpellSelections,
  Class,
  Spell,
  Subclass,
  AbilityScores,
} from "@/shared/types";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { isPactMagicClass } from "../spellcasting-label.utils";
import { getPactMagicProgression } from "../pact-magic.utils";
import {
  resolveSubclassSpells,
  spellMatchesCharacterSpellList,
  type CharacterSpellListContext,
} from "../subclass-spells.utils";
import { pickByRpgbot, pickMultipleByRpgbot } from "./character-randomizer.utils";
import { filterSpellsForClassFit } from "./spell-class-fit.utils";

function parseSpellDamageRoll(description: string[]): string | undefined {
  const text = description.join(" ");
  const match = text.match(/\b(\d+d\d+)(?:\s*\+\s*\d+)?\b/i);
  return match?.[1];
}

function spellToSelection(spell: Spell): BuilderSpellSelection {
  return {
    id: spell.id,
    name: spell.name,
    level: spell.level,
    source: spell.source,
    school: spell.schoolName,
    damageRoll: parseSpellDamageRoll(spell.description),
  };
}

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

export function buildRandomSpellSelections(params: {
  allSpells: Spell[];
  classData: Class;
  subclass: Subclass | null;
  level: number;
  abilities: AbilityScores;
  rpgbotLookup: RpgbotLookupFn | null;
}): BuilderSpellSelections {
  const { allSpells, classData, subclass, level, rpgbotLookup } = params;
  const selections: BuilderSpellSelections = {};

  if (!classData.casterProgression || classData.casterProgression === "none") {
    if (!subclass?.casterProgression) return selections;
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
    const picked = pickMultipleByRpgbot(
      cantrips,
      cantripCount,
      (spell) => rpgbotLookup?.(spell.name, spell.source) ?? null,
    );
    if (picked.length > 0) {
      selections[0] = picked.map(spellToSelection);
    }
  }

  const maxSpells = isPact
    ? (getPactMagicProgression(classData.spellProgression, rowIndex)
        ?.preparedSpellCount ?? getMaxSpellsKnown(classData, level))
    : getMaxSpellsKnown(classData, level);

  if (maxSpells <= 0) return selections;

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
    const picked = pickMultipleByRpgbot(
      pool,
      maxSpells,
      (spell) => rpgbotLookup?.(spell.name, spell.source) ?? null,
    );
    for (const spell of picked) {
      const bucket = selections[spell.level] ?? [];
      selections[spell.level] = [...bucket, spellToSelection(spell)];
    }
    return selections;
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
    const perLevel = Math.max(1, Math.ceil(remaining / availableSpellSlotLevels.length));
    const picked = pickMultipleByRpgbot(
      pool,
      Math.min(perLevel, remaining),
      (spell) => rpgbotLookup?.(spell.name, spell.source) ?? null,
    );
    if (picked.length > 0) {
      selections[spellLevel] = picked.map(spellToSelection);
      remaining -= picked.length;
    }
  }

  return selections;
}

export function pickRandomSpellAtLevel(
  spells: Spell[],
  level: number,
  lookup: RpgbotLookupFn | null,
): Spell | null {
  const pool = spells.filter((spell) => spell.level === level);
  return pickByRpgbot(pool, (spell) => lookup?.(spell.name, spell.source) ?? null);
}
