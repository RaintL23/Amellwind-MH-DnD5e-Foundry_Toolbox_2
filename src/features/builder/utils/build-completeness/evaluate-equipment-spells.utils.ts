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
    if (
      spellcasting.cantripCount > 0 &&
      spellcasting.selectedCantripCount < spellcasting.cantripCount
    ) {
      issues.push({
        id: "spells-cantrips",
        section: "spells",
        message: `Choose ${spellcasting.cantripCount - spellcasting.selectedCantripCount} more cantrip${spellcasting.cantripCount - spellcasting.selectedCantripCount === 1 ? "" : "s"} (${spellcasting.selectedCantripCount}/${spellcasting.cantripCount})`,
        slot: "spell-level-0",
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
