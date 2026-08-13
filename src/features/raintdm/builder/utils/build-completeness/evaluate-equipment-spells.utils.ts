import { PACT_SPELL_SLOT } from "../pact-magic.utils";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";
import { collectStartingEquipmentIssues } from "./helpers";

export function evaluateEquipmentAndSpellsCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  if (input.classData && input.classSelection) {
    issues.push(
      ...collectStartingEquipmentIssues(
        input.classData.startingEquipmentOffers,
        {
          type: "class",
          id: input.classSelection.id,
          name: input.classSelection.name,
        },
        input.inventoryItems,
      ),
    );
  }

  if (input.dndBackground && input.background) {
    issues.push(
      ...collectStartingEquipmentIssues(
        input.dndBackground.startingEquipmentOffers,
        {
          type: "background",
          id: input.background.id,
          name: input.background.name,
        },
        input.inventoryItems,
      ),
    );
  }

  const spellcasting = input.spellcasting;
  if (spellcasting?.isSpellcaster) {
    const classCantripsSelected = spellcasting.classCantripsSelected;

    if (
      spellcasting.cantripCount > 0 &&
      classCantripsSelected < spellcasting.cantripCount
    ) {
      const missing = spellcasting.cantripCount - classCantripsSelected;
      issues.push({
        id: "spells-cantrips-class",
        section: "spells",
        message: `Choose ${missing} more class cantrip${missing === 1 ? "" : "s"} (${classCantripsSelected}/${spellcasting.cantripCount})`,
        slot: "spell-level-0",
        highlightKey: "cantrips",
      });
    } else if (
      spellcasting.cantripCount > 0 &&
      classCantripsSelected > spellcasting.cantripCount
    ) {
      const excess = classCantripsSelected - spellcasting.cantripCount;
      issues.push({
        id: "spells-cantrips-class-excess",
        section: "spells",
        message: `Remove ${excess} extra class cantrip${excess === 1 ? "" : "s"} (${classCantripsSelected}/${spellcasting.cantripCount})`,
        slot: "spell-level-0",
        highlightKey: "cantrips",
      });
    }

    for (const pool of spellcasting.bonusCantripPools) {
      if (pool.selectedCount >= pool.maxCount) continue;
      const missing = pool.maxCount - pool.selectedCount;
      issues.push({
        id: `spells-cantrips-${pool.poolId}`,
        section: "spells",
        message: `Choose ${missing} more cantrip${missing === 1 ? "" : "s"} for ${pool.label} (${pool.selectedCount}/${pool.maxCount})`,
        slot: pool.slot,
        highlightKey: "cantrips",
      });
    }

    if (
      spellcasting.maxPreparedOrKnown > 0 &&
      spellcasting.selectedSpellCount < spellcasting.maxPreparedOrKnown
    ) {
      issues.push({
        id: "spells-prepared",
        section: "spells",
        message: `Choose ${spellcasting.maxPreparedOrKnown - spellcasting.selectedSpellCount} more spell${spellcasting.maxPreparedOrKnown - spellcasting.selectedSpellCount === 1 ? "" : "s"} (${spellcasting.selectedSpellCount}/${spellcasting.maxPreparedOrKnown})`,
        slot: spellcasting.usesUnifiedPactPool
          ? PACT_SPELL_SLOT
          : "spell-level-1",
        highlightKey: "spells",
      });
    }
  }

  return issues;
}
