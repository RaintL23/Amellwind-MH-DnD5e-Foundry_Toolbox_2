import type { Class, Subclass } from "@/shared/types";
import type { SpellcastingInfo } from "@/features/raintdm/builder/hooks/useSpellcasting";

const ORDINAL_LEVEL: Record<string, number> = {
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  "4th": 4,
  "5th": 5,
  "6th": 6,
  "7th": 7,
  "8th": 8,
  "9th": 9,
};

function cellToNumber(val: string): number {
  if (!val || val === "—") return 0;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function getSpellSlotTotals(
  classData: Class | null,
  subclassData: Subclass | null,
  characterLevel: number,
  spellcasting: SpellcastingInfo,
): Record<number, number> {
  const totals: Record<number, number> = {};

  if (!spellcasting.isSpellcaster) return totals;

  if (spellcasting.isPactMagic && spellcasting.pactSlotCount > 0) {
    totals[spellcasting.pactMaxSpellLevel] = spellcasting.pactSlotCount;
    return totals;
  }

  const spellProgression =
    subclassData?.spellProgression?.length &&
    spellcasting.spellcastingFromSubclass
      ? subclassData.spellProgression
      : classData?.spellProgression;

  if (!spellProgression?.length) return totals;

  const rowIndex = characterLevel - 1;
  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (label.toLowerCase().includes("slot level")) continue;

      const matched = Object.entries(ORDINAL_LEVEL).find(([key]) =>
        label.toLowerCase().includes(key.toLowerCase()),
      );
      if (!matched) continue;

      const spellLevel = matched[1];
      const slots = cellToNumber(row[i] ?? "—");
      if (slots > 0) totals[spellLevel] = slots;
    }
  }

  return totals;
}
