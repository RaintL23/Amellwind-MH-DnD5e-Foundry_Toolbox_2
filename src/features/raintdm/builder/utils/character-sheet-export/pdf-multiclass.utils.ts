/**
 * Multiclass helpers for the PDF sheet: one spell list across classes and
 * the shared spell slot totals (Multiclass Spellcaster table + Pact Magic).
 */
import type { Class, Subclass } from "@/shared/types";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import {
  getMulticlassCasterLevel,
  getMulticlassSpellSlotCounts,
  hasMultipleSpellcastingClasses,
} from "@/shared/utils/multiclass-spell-slots.utils";
import type { CharacterSheetSpellExport } from "./character-sheet-export.types";
import { getSpellSlotTotals } from "./pdf-spell-slots.utils";

export interface PdfClassCasting {
  classData: Class | null;
  subclassData: Subclass | null;
  /** Class level (not total character level). */
  level: number;
  spellcasting: SpellcastingInfo;
}

/** Concatenates per-class spell lists, keeping the first copy of a spell. */
export function mergeSpellExports(
  lists: CharacterSheetSpellExport[][],
): CharacterSheetSpellExport[] {
  const seen = new Set<string>();
  const merged: CharacterSheetSpellExport[] = [];
  for (const spell of lists.flat()) {
    const key = spell.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(spell);
  }
  return merged.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/**
 * Spell slots of the whole build. With two or more spellcasting classes the
 * Multiclass Spellcaster table applies (Pact Magic slots are added on top);
 * otherwise the only caster's own table is used.
 */
export function getBuildSpellSlotTotals(
  classes: PdfClassCasting[],
): Record<number, number> {
  const casters = classes.filter((c) => c.spellcasting.isSpellcaster);
  if (casters.length <= 1) {
    const only = casters[0];
    return only
      ? getSpellSlotTotals(only.classData, only.subclassData, only.level, only.spellcasting)
      : {};
  }

  const entries = classes.map((c) => ({
    classData: c.classData,
    level: c.level,
    subclassName: c.subclassData?.name ?? null,
  }));
  const totals = hasMultipleSpellcastingClasses(entries)
    ? { ...getMulticlassSpellSlotCounts(getMulticlassCasterLevel(entries)) }
    : {};
  for (const pact of casters.filter((c) => c.spellcasting.isPactMagic)) {
    const level = pact.spellcasting.pactMaxSpellLevel;
    if (level > 0) totals[level] = (totals[level] ?? 0) + pact.spellcasting.pactSlotCount;
  }
  return totals;
}
