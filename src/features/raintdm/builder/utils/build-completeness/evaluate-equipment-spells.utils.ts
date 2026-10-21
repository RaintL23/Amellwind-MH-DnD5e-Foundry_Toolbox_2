import { PACT_SPELL_SLOT } from "../pact-magic.utils";
import { toMulticlassSpellSlot } from "../multiclass.utils";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";
import { collectStartingEquipmentIssues } from "./helpers";
import { resolveStartingEquipmentOffers } from "../amellwind-starting-equipment.utils";
import {
  fitArmorRarityProperties,
  isArmorRarityPropertyComplete,
} from "../armor-rarity-properties.utils";

export function evaluateEquipmentAndSpellsCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  if (input.classData && input.classSelection) {
    issues.push(
      ...collectStartingEquipmentIssues(
        resolveStartingEquipmentOffers(
          input.classData.startingEquipmentOffers,
          input.useAmellwindHomebrew,
        ),
        {
          type: "class",
          id: input.classSelection.id,
          name: input.classSelection.name,
        },
        input.inventoryItems,
      ),
    );
  }

  const backgroundOffers =
    input.dndBackground?.startingEquipmentOffers ??
    input.amellwindBackgroundEquipmentOffers;
  if (backgroundOffers && input.background) {
    issues.push(
      ...collectStartingEquipmentIssues(
        resolveStartingEquipmentOffers(
          backgroundOffers,
          input.useAmellwindHomebrew,
        ),
        {
          type: "background",
          id: input.background.id,
          name: input.background.name,
        },
        input.inventoryItems,
      ),
    );
  }

  const armor = input.armor;
  if (input.useAmellwindHomebrew && armor) {
    const properties = fitArmorRarityProperties(
      armor.rarityProperties,
      armor.rarity,
    );
    properties.forEach((property, index) => {
      if (isArmorRarityPropertyComplete(property)) return;
      issues.push({
        id: `armor-rarity-property-${index}`,
        section: "starting-equipment",
        message: `Choose a rarity property for your ${armor.armor.name}`,
        slot: "armor",
        highlightKey: "armor",
      });
    });
  }

  if (input.spellcasting) {
    issues.push(...evaluateSpellcastingIssues(input.spellcasting, PRIMARY_SCOPE));
  }
  for (const mc of input.multiclassSpellcasting ?? []) {
    issues.push(
      ...evaluateSpellcastingIssues(mc.spellcasting, {
        idPrefix: `multiclass-${mc.index}-`,
        messagePrefix: `${mc.className}: `,
        toSlot: (slot) => toMulticlassSpellSlot(mc.index, slot),
      }),
    );
  }

  return issues;
}

interface SpellIssueScope {
  idPrefix: string;
  messagePrefix: string;
  toSlot: (slot: string) => BuildCompletenessIssue["slot"];
}

const PRIMARY_SCOPE: SpellIssueScope = {
  idPrefix: "",
  messagePrefix: "",
  toSlot: (slot) => slot as BuildCompletenessIssue["slot"],
};

/** Cantrip / prepared-spell gaps of one class (primary or additional). */
function evaluateSpellcastingIssues(
  spellcasting: SpellcastingInfo,
  scope: SpellIssueScope,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];
  for (const pool of spellcasting.bonusCantripPools) {
    if (pool.needsSpellListChoice) {
      issues.push({
        id: `${scope.idPrefix}spells-list-${pool.poolId}`,
        section: "spells",
        message: `${scope.messagePrefix}Choose a spell list for ${pool.label}`,
        slot: scope.toSlot(pool.slot),
        highlightKey: "cantrips",
      });
      continue;
    }
    if (pool.selectedCount >= pool.maxCount) continue;
    const missing = pool.maxCount - pool.selectedCount;
    const unit = pool.spellLevel === 0 ? "cantrip" : "spell";
    issues.push({
      id: `${scope.idPrefix}spells-cantrips-${pool.poolId}`,
      section: "spells",
      message: `${scope.messagePrefix}Choose ${missing} more ${unit}${missing === 1 ? "" : "s"} for ${pool.label} (${pool.selectedCount}/${pool.maxCount})`,
      slot: scope.toSlot(pool.slot),
      highlightKey: "cantrips",
    });
  }

  if (spellcasting.isSpellcaster) {
    const classCantripsSelected = spellcasting.classCantripsSelected;

    if (
      spellcasting.cantripCount > 0 &&
      classCantripsSelected < spellcasting.cantripCount
    ) {
      const missing = spellcasting.cantripCount - classCantripsSelected;
      issues.push({
        id: `${scope.idPrefix}spells-cantrips-class`,
        section: "spells",
        message: `${scope.messagePrefix}Choose ${missing} more class cantrip${missing === 1 ? "" : "s"} (${classCantripsSelected}/${spellcasting.cantripCount})`,
        slot: scope.toSlot("spell-level-0"),
        highlightKey: "cantrips",
      });
    } else if (
      spellcasting.cantripCount > 0 &&
      classCantripsSelected > spellcasting.cantripCount
    ) {
      const excess = classCantripsSelected - spellcasting.cantripCount;
      issues.push({
        id: `${scope.idPrefix}spells-cantrips-class-excess`,
        section: "spells",
        message: `${scope.messagePrefix}Remove ${excess} extra class cantrip${excess === 1 ? "" : "s"} (${classCantripsSelected}/${spellcasting.cantripCount})`,
        slot: scope.toSlot("spell-level-0"),
        highlightKey: "cantrips",
      });
    }

    if (
      spellcasting.maxPreparedOrKnown > 0 &&
      spellcasting.selectedSpellCount < spellcasting.maxPreparedOrKnown
    ) {
      issues.push({
        id: `${scope.idPrefix}spells-prepared`,
        section: "spells",
        message: `${scope.messagePrefix}Choose ${spellcasting.maxPreparedOrKnown - spellcasting.selectedSpellCount} more spell${spellcasting.maxPreparedOrKnown - spellcasting.selectedSpellCount === 1 ? "" : "s"} (${spellcasting.selectedSpellCount}/${spellcasting.maxPreparedOrKnown})`,
        slot: scope.toSlot(
          spellcasting.usesUnifiedPactPool ? PACT_SPELL_SLOT : "spell-level-1",
        ),
        highlightKey: "spells",
      });
    }
  }

  return issues;
}
