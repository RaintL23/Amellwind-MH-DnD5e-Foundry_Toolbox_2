import { Rune } from "@/shared/types";

export interface RuleViolation {
  rule: string;
  offenders: string[];
}

/** Groups of tags exclusive to armor (max 1 per group) */
const ARMOR_RULE_GROUPS: { tags: string[]; rule: string }[] = [
  {
    tags: ["mechanic:resistance", "mechanic:immunity", "mechanic:damage-reduction"],
    rule: "Only 1 material with resistance, reduction or elemental immunity (rule 1)",
  },
  {
    tags: ["mechanic:ac"],
    rule: "Only 1 material that grants AC bonus (rule 3)",
  },
  {
    tags: ["mechanic:rune-charges"],
    rule: "Only 1 material with rune effect (rule 4)",
  },
];

/** Groups of tags exclusive to weapon (max 1 per group) */
const WEAPON_RULE_GROUPS: { tags: string[]; rule: string }[] = [
  {
    tags: ["mechanic:critical"],
    rule: "Only 1 material with effect when rolling a natural 20 (rule 1)",
  },
  {
    tags: ["mechanic:extra-damage", "mechanic:condition"],
    rule: "Only 1 material with extra damage, condition on hit or effect on impact (rule 2)",
  },
  {
    tags: ["mechanic:rune-charges"],
    rule: "Only 1 material with rune effect (rule 3)",
  },
];

function getSlotTags(rune: Rune, slotType: "weapon" | "armor"): string[] {
  return slotType === "weapon" ? rune.weaponTags : rune.armorTags;
}

function checkGroups(
  runes: (Rune | null)[],
  groups: { tags: string[]; rule: string }[],
  slotType: "weapon" | "armor",
): RuleViolation[] {
  const filled = runes.filter((r): r is Rune => r !== null);
  const violations: RuleViolation[] = [];

  for (const group of groups) {
    const matching = filled.filter((r) =>
      getSlotTags(r, slotType).some((t) => group.tags.includes(t)),
    );
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
  return checkGroups(runes, ARMOR_RULE_GROUPS, "armor");
}

export function getWeaponViolations(runes: (Rune | null)[]): RuleViolation[] {
  return checkGroups(runes, WEAPON_RULE_GROUPS, "weapon");
}

/** Returns true if adding this rune to the slot type would violate a rule */
export function wouldViolateRule(
  rune: Rune,
  existing: (Rune | null)[],
  slotType: "weapon" | "armor",
): RuleViolation | null {
  const groups = slotType === "armor" ? ARMOR_RULE_GROUPS : WEAPON_RULE_GROUPS;
  const filled = existing.filter((r): r is Rune => r !== null);
  const runeTags = getSlotTags(rune, slotType);

  for (const group of groups) {
    if (!runeTags.some((t) => group.tags.includes(t))) continue;
    const matching = filled.filter((r) =>
      getSlotTags(r, slotType).some((t) => group.tags.includes(t)),
    );
    if (matching.length >= 1) {
      return {
        rule: group.rule,
        offenders: [rune.name, ...matching.map((r) => r.name)],
      };
    }
  }

  return null;
}
