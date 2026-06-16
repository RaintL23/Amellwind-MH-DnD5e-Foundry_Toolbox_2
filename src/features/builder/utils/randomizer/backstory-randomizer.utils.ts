import { XGE_SECTIONS, TABLE_BY_ID } from "@/features/xanathar-backstory/data/xanathar-tables.data";
import {
  extractLifestyleModifier,
  rollOnTable,
  type RollContext,
  type RollResult,
} from "@/features/xanathar-backstory/utils/xanathar-roll.utils";
import { cascadeDependents } from "@/features/xanathar-backstory/utils/xanathar-cascade.utils";
import { formatBackstorySummaryText } from "@/features/xanathar-backstory/utils/xanathar-summary-text.utils";

function buildRollContext(
  results: Record<string, RollResult>,
  params: {
    raceName: string;
    charismaModifier: number;
  },
): RollContext {
  const lifestyleResult = results["family-lifestyle"];
  return {
    charismaModifier: params.charismaModifier,
    lifestyleModifier: lifestyleResult
      ? extractLifestyleModifier(lifestyleResult.result)
      : 0,
    isDwarfOrElf: params.raceName === "Dwarf" || params.raceName === "Elf",
  };
}

export function generateXanatharBackstoryNotes(params: {
  raceName: string;
  backgroundName: string;
  className: string;
  charismaModifier: number;
}): string {
  const results: Record<string, RollResult> = {};

  const rollAndCascade = (tableId: string) => {
    const table = TABLE_BY_ID[tableId];
    if (!table) return;
    results[tableId] = rollOnTable(table, buildRollContext(results, params));
    cascadeDependents(results, tableId, buildRollContext(results, params));
  };

  for (const id of [
    "parents",
    "birthplace",
    "siblings-count",
    "family",
    "family-lifestyle",
    "childhood-memories",
  ]) {
    rollAndCascade(id);
  }

  const raceTableMap: Record<string, string> = {
    "Half-Elf": "parents-half-elf",
    "Half-Orc": "parents-half-orc",
    Tiefling: "parents-tiefling",
  };
  const raceTableId = raceTableMap[params.raceName];
  if (raceTableId) rollAndCascade(raceTableId);

  if (params.backgroundName) {
    const bgTable = XGE_SECTIONS[1]?.tables.find(
      (table) =>
        table.filterType === "background" &&
        table.filterValue === params.backgroundName,
    );
    if (bgTable) rollAndCascade(bgTable.id);
  }

  if (params.className) {
    const clsTable = XGE_SECTIONS[1]?.tables.find(
      (table) =>
        table.filterType === "class" && table.filterValue === params.className,
    );
    if (clsTable) rollAndCascade(clsTable.id);
  }

  rollAndCascade("life-events-by-age");

  return formatBackstorySummaryText(results);
}
