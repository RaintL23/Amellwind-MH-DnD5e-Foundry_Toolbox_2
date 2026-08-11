import { Rune } from "@/shared/types";

export interface RuleViolation {
  rule: string;
  offenders: string[];
}

type SlotType = "weapon" | "armor";

/**
 * True when `tags` contains `prefix` or a scaled variant (`prefix:minor`, etc.).
 * Exact equality alone misses mapper output like `mechanic:extra-damage:minor`.
 */
export function hasTagPrefix(tags: string[], prefix: string): boolean {
  return tags.some((t) => t === prefix || t.startsWith(`${prefix}:`));
}

/** Extra damage that only applies when the target already has a condition. */
function isConditionalExtraDamage(effectText: string | null): boolean {
  if (!effectText) return false;
  if (!/extra (?:\{@damage|\d+)/i.test(effectText)) return false;
  return (
    /(?:if|while|whilst|when|against)\b[\s\S]{0,100}\{@condition/i.test(
      effectText,
    ) ||
    /(?:to|against) (?:a |an )?(?:creature |target )?(?:that is |who is )?\{@condition/i.test(
      effectText,
    )
  );
}

/** True when the effect actively applies a condition (not only as a damage gate). */
function inflictsConditionOnHit(effectText: string | null): boolean {
  if (!effectText || !/\{@condition/i.test(effectText)) return false;
  // Remove prerequisite clauses ("if/while … {@condition}") then check leftovers.
  const withoutGates = effectText.replace(
    /(?:if|while|whilst|when|against)\b[\s\S]{0,100}\{@condition[^}]*\}/gi,
    "",
  );
  if (/\{@condition/i.test(withoutGates)) return true;
  return /(?:saving throw|must succeed|becomes?|knock(?:ed|s)?|inflict)\b/i.test(
    effectText,
  );
}

/** Weapon rule 1 materials (nat-20 / critical) are exempt from rule 2. */
function isCriticalExempt(tags: string[]): boolean {
  return hasTagPrefix(tags, "mechanic:critical");
}

/**
 * Weapon rule 2: one material with extra damage, condition-on-hit, or on-hit effect.
 * - Critical (rule 1) materials are exempt.
 * - Extra damage that requires a condition does not count as "extra damage".
 * - A `{@condition}` used only as that damage gate does not count as condition-inflicting.
 */
function matchesWeaponOnHitRule(rune: Rune): boolean {
  const tags = rune.weaponTags;
  if (isCriticalExempt(tags)) return false;

  const effect = rune.weaponEffect;
  const conditionalExtra = isConditionalExtraDamage(effect);

  if (
    hasTagPrefix(tags, "mechanic:extra-damage") &&
    !conditionalExtra
  ) {
    return true;
  }

  if (hasTagPrefix(tags, "mechanic:condition")) {
    if (conditionalExtra && !inflictsConditionOnHit(effect)) return false;
    return true;
  }

  return false;
}

/** Armor rule 1: elemental resistance, damage reduction, or elemental immunity. */
function matchesArmorElementalDefense(rune: Rune): boolean {
  const tags = rune.armorTags;
  if (hasTagPrefix(tags, "mechanic:resistance")) return true;
  if (hasTagPrefix(tags, "mechanic:damage-reduction")) return true;
  // Elemental immunity only — condition immunity belongs to rule 2.
  if (
    hasTagPrefix(tags, "mechanic:immunity") &&
    !hasTagPrefix(tags, "mechanic:condition")
  ) {
    return true;
  }
  return false;
}

/** Armor rule 2: advantage or immunity vs a condition. */
function matchesArmorConditionDefense(rune: Rune): boolean {
  const tags = rune.armorTags;
  if (!hasTagPrefix(tags, "mechanic:condition")) return false;
  return (
    hasTagPrefix(tags, "mechanic:advantage") ||
    hasTagPrefix(tags, "mechanic:immunity")
  );
}

interface RuleGroup {
  rule: string;
  matches: (rune: Rune) => boolean;
}

const ARMOR_RULE_GROUPS: RuleGroup[] = [
  {
    rule: "Only 1 material with resistance, reduction or elemental immunity (rule 1)",
    matches: matchesArmorElementalDefense,
  },
  {
    rule: "Only 1 material with advantage or immunity vs a condition (rule 2)",
    matches: matchesArmorConditionDefense,
  },
  {
    rule: "Only 1 material that grants AC bonus (rule 3)",
    matches: (r) => hasTagPrefix(r.armorTags, "mechanic:ac"),
  },
  {
    rule: "Only 1 material with rune effect (rule 4)",
    matches: (r) => hasTagPrefix(r.armorTags, "mechanic:rune-charges"),
  },
];

const WEAPON_RULE_GROUPS: RuleGroup[] = [
  {
    rule: "Only 1 material with effect when rolling a natural 20 (rule 1)",
    matches: (r) => hasTagPrefix(r.weaponTags, "mechanic:critical"),
  },
  {
    rule: "Only 1 material with extra damage, condition on hit or effect on impact (rule 2)",
    matches: matchesWeaponOnHitRule,
  },
  {
    rule: "Only 1 material with rune effect (rule 3)",
    matches: (r) => hasTagPrefix(r.weaponTags, "mechanic:rune-charges"),
  },
  {
    rule: "Only 1 material with bonus to spell DC or spell attack (rule 4)",
    matches: (r) => hasTagPrefix(r.weaponTags, "mechanic:spell-buff"),
  },
];

function checkGroups(
  runes: (Rune | null)[],
  groups: RuleGroup[],
): RuleViolation[] {
  const filled = runes.filter((r): r is Rune => r !== null);
  const violations: RuleViolation[] = [];

  for (const group of groups) {
    const matching = filled.filter((r) => group.matches(r));
    if (matching.length > 1) {
      violations.push({
        rule: group.rule,
        offenders: matching.map((r) => r.name),
      });
    }
  }

  return violations;
}

export function getArmorViolations(runes: (Rune | null)[]): RuleViolation[] {
  return checkGroups(runes, ARMOR_RULE_GROUPS);
}

export function getWeaponViolations(runes: (Rune | null)[]): RuleViolation[] {
  return checkGroups(runes, WEAPON_RULE_GROUPS);
}

/** Returns true if adding this rune to the slot type would violate a rule */
export function wouldViolateRule(
  rune: Rune,
  existing: (Rune | null)[],
  slotType: SlotType,
): RuleViolation | null {
  const groups = slotType === "armor" ? ARMOR_RULE_GROUPS : WEAPON_RULE_GROUPS;
  const filled = existing.filter((r): r is Rune => r !== null);

  for (const group of groups) {
    if (!group.matches(rune)) continue;
    const matching = filled.filter((r) => group.matches(r));
    if (matching.length >= 1) {
      return {
        rule: group.rule,
        offenders: [rune.name, ...matching.map((r) => r.name)],
      };
    }
  }

  return null;
}
