/**
 * Spell attack bonus / save DC for Builder UI and PDF export.
 * Formula: attack = proficiency + spell mod; DC = 8 + proficiency + spell mod.
 */
import { toAbilityKey } from "@/shared/constants/dnd";
import type {
  AbilityKey,
  BuilderBonusCantripSlot,
  BuilderSpellSelections,
  Spell,
} from "@/shared/types";
import { formatModifier } from "@/shared/utils/cr.utils";
import type { SpellcastingInfo } from "../hooks/useSpellcasting";
import {
  findCantripPoolBySlot,
  isBonusCantripSlot,
} from "./cantrip-pools.utils";
import {
  grantsForPactPool,
  PACT_SPELL_POOL_LEVEL,
  PACT_SPELL_SLOT,
} from "./pact-magic.utils";
import { isSpeciesLineageSpell } from "./species-spell-grants.utils";
import { grantsForSpellLevel } from "./subclass-spells.utils";

export interface SpellcastingAttackStats {
  spellSaveDc: string | undefined;
  spellAttackBonus: string | undefined;
  spellcastingMod: string | undefined;
}

export function computeSpellcastingAttackStats(
  spellcastingAbility: string | null | undefined,
  proficiencyBonus: number,
  getModifier: (key: AbilityKey) => number,
): SpellcastingAttackStats {
  const spellKey = toAbilityKey(spellcastingAbility ?? null);
  if (spellKey === null) {
    return {
      spellSaveDc: undefined,
      spellAttackBonus: undefined,
      spellcastingMod: undefined,
    };
  }
  const spellMod = getModifier(spellKey);
  return {
    spellSaveDc: String(8 + proficiencyBonus + spellMod),
    spellAttackBonus: formatModifier(proficiencyBonus + spellMod),
    spellcastingMod: formatModifier(spellMod),
  };
}

/** True when the character can open a browsable spell list (class caster or feat/feature pools). */
export function hasChoosableSpellList(info: SpellcastingInfo): boolean {
  return info.isSpellcaster || info.bonusCantripPools.length > 0;
}

/**
 * Whether the slot should show the Available (pickable) spell list.
 * Species-only levels without class list access are grant-display only.
 */
export function isSpellSlotChoosable(
  slot: string,
  info: SpellcastingInfo,
): boolean {
  if (slot === PACT_SPELL_SLOT) return info.usesUnifiedPactPool;
  if (isBonusCantripSlot(slot)) {
    return info.bonusCantripPools.some((pool) => pool.slot === slot);
  }
  if (!slot.startsWith("spell-level-")) return false;
  const level = Number(slot.replace("spell-level-", ""));
  if (!Number.isFinite(level)) return false;
  if (level === 0) return info.cantripCount > 0;
  return info.availableSpellLevels.includes(level);
}

/** Selection level key used in BuilderSpellSelections for a spell-picker slot. */
export function resolveSpellSlotSelectionLevel(
  slot: string,
  info: SpellcastingInfo,
): number | null {
  if (slot === PACT_SPELL_SLOT) return PACT_SPELL_POOL_LEVEL;
  if (isBonusCantripSlot(slot)) {
    return (
      findCantripPoolBySlot(
        info.bonusCantripPools,
        slot as BuilderBonusCantripSlot,
      )?.selectionLevel ?? null
    );
  }
  if (!slot.startsWith("spell-level-")) return null;
  const level = Number(slot.replace("spell-level-", ""));
  return Number.isFinite(level) ? level : null;
}

/** Locked grants (species / subclass / optional features) visible for this slot. */
export function spellSlotHasLockedGrants(
  slot: string,
  info: SpellcastingInfo,
  spellSelections: BuilderSpellSelections,
  spellLevelByName: Map<string, number>,
  spellsByName: Spell[],
): boolean {
  const selectionLevel = resolveSpellSlotSelectionLevel(slot, info);
  if (selectionLevel === null) return false;

  const atLevel = spellSelections[selectionLevel] ?? [];
  if (atLevel.some((spell) => isSpeciesLineageSpell(spell))) return true;

  if (slot === PACT_SPELL_SLOT) {
    const maxLevel = info.pactMaxSpellLevel;
    return (
      grantsForPactPool(
        info.subclassAlwaysPrepared,
        maxLevel,
        spellLevelByName,
        spellsByName,
      ).length > 0 ||
      grantsForPactPool(
        info.subclassBonusKnown,
        maxLevel,
        spellLevelByName,
        spellsByName,
      ).length > 0 ||
      grantsForPactPool(
        info.optionalFeatureGranted,
        maxLevel,
        spellLevelByName,
        spellsByName,
      ).length > 0
    );
  }

  if (isBonusCantripSlot(slot)) return false;

  const level = selectionLevel;
  return (
    grantsForSpellLevel(
      info.subclassAlwaysPrepared,
      level,
      spellLevelByName,
      spellsByName,
    ).length > 0 ||
    grantsForSpellLevel(
      info.subclassBonusKnown,
      level,
      spellLevelByName,
      spellsByName,
    ).length > 0 ||
    grantsForSpellLevel(
      info.optionalFeatureGranted,
      level,
      spellLevelByName,
      spellsByName,
    ).length > 0
  );
}

export function resolveSpellcastingSourceName(options: {
  spellcastingInfo: SpellcastingInfo;
  className: string | null | undefined;
  speciesGrantLabel: string | null | undefined;
}): string | null {
  const { spellcastingInfo, className, speciesGrantLabel } = options;
  if (spellcastingInfo.isSpellcaster) {
    if (spellcastingInfo.spellcastingFromSubclass) {
      return (
        spellcastingInfo.subclassShortName ??
        spellcastingInfo.subclassName ??
        className ??
        null
      );
    }
    return className ?? null;
  }
  if (speciesGrantLabel) return speciesGrantLabel;
  const poolLabel = spellcastingInfo.bonusCantripPools[0]?.label;
  return poolLabel ?? null;
}

/** Title: `{sectionLabel} - {source} - Spell Attack Bonus {x} - Spell Save DC {y}` */
export function buildSpellcastingSectionTitle(options: {
  sectionLabel: string;
  sourceName: string | null;
  spellAttackBonus: string | undefined;
  spellSaveDc: string | undefined;
}): string {
  const parts = [options.sectionLabel];
  if (options.sourceName) parts.push(options.sourceName);
  if (options.spellAttackBonus) {
    parts.push(`Spell Attack Bonus ${options.spellAttackBonus}`);
  }
  if (options.spellSaveDc) {
    parts.push(`Spell Save DC ${options.spellSaveDc}`);
  }
  return parts.join(" - ");
}
