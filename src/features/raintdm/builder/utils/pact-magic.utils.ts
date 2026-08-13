import type { ClassTableGroup } from "@/shared/types";
import type { BuilderSpellSelection } from "@/shared/types";
import {
  resolveGrantSpellLevel,
  type SubclassSpellGrant,
} from "./subclass-spells.utils";

/** Internal key in BuilderSpellSelections for the unified Warlock pact spell list. */
export const PACT_SPELL_POOL_LEVEL = -1;

export const PACT_SPELL_SLOT = "spell-pact" as const;
export type BuilderPactSpellSlot = typeof PACT_SPELL_SLOT;

export interface PactMagicProgression {
  cantripCount: number;
  preparedSpellCount: number;
  pactSlotCount: number;
  /** Max spell level on the prepared list; all pact slots cast at this level. */
  pactSlotLevel: number;
  /** True when the class table uses "Prepared Spells" (2024) vs "Spells Known" (2014). */
  usesPreparedSpells: boolean;
}

function cellToNumber(val: string): number {
  if (!val || val === "—") return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function findColumnIndex(labels: string[], ...patterns: string[]): number {
  for (const pattern of patterns) {
    const idx = labels.findIndex((l) => l.toLowerCase().includes(pattern));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseSlotLevelCell(cell: string): number {
  if (!cell || cell === "—") return 0;
  const match = cell.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Reads the Warlock Features table (Cantrips, Prepared/Spells Known, Spell Slots, Slot Level). */
export function getPactMagicProgression(
  spellProgression: ClassTableGroup[],
  rowIndex: number,
): PactMagicProgression | null {
  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;

    const slotsIdx = findColumnIndex(labels, "spell slot");
    const slotLevelIdx = findColumnIndex(labels, "slot level");
    if (slotsIdx === -1 || slotLevelIdx === -1) continue;

    const cantripIdx = findColumnIndex(labels, "cantrip");
    const preparedIdx = findColumnIndex(
      labels,
      "prepared spell",
      "spells known",
    );

    return {
      cantripCount: cantripIdx >= 0 ? cellToNumber(row[cantripIdx] ?? "—") : 0,
      preparedSpellCount:
        preparedIdx >= 0 ? cellToNumber(row[preparedIdx] ?? "—") : 0,
      pactSlotCount: cellToNumber(row[slotsIdx] ?? "—"),
      pactSlotLevel: parseSlotLevelCell(row[slotLevelIdx] ?? ""),
      usesPreparedSpells:
        preparedIdx >= 0 &&
        labels[preparedIdx]!.toLowerCase().includes("prepared"),
    };
  }
  return null;
}

export function grantsForPactPool(
  grants: SubclassSpellGrant[],
  maxSpellLevel: number,
  spellLevelByName: Map<string, number>,
  spellsByName?: Array<{ name: string; level: number }>,
): SubclassSpellGrant[] {
  if (maxSpellLevel < 1) return [];
  return grants.filter((grant) => {
    const level = resolveGrantSpellLevel(
      grant.name,
      spellLevelByName,
      spellsByName,
    );
    return level !== undefined && level >= 1 && level <= maxSpellLevel;
  });
}

export function pactPoolSelectedCount(
  selections: Record<number, BuilderSpellSelection[] | undefined>,
): number {
  return (selections[PACT_SPELL_POOL_LEVEL] ?? []).length;
}
