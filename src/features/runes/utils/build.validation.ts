import { Rune } from "@/shared/types";

export interface RuleViolation {
  rule: string;
  offenders: string[];
}

/** Grupos de tags exclusivos para armadura (máx 1 por grupo) */
const ARMOR_RULE_GROUPS: { tags: string[]; rule: string }[] = [
  {
    tags: ["mechanic:resistance", "mechanic:immunity"],
    rule: "Solo 1 material con resistencia, reducción o inmunidad elemental (regla 1)",
  },
  {
    tags: ["mechanic:ac"],
    rule: "Solo 1 material que otorgue bonus de AC (regla 3)",
  },
  {
    tags: ["mechanic:rune-charges"],
    rule: "Solo 1 material con efecto de runas (regla 4)",
  },
];

/** Grupos de tags exclusivos para arma (máx 1 por grupo) */
const WEAPON_RULE_GROUPS: { tags: string[]; rule: string }[] = [
  {
    tags: ["mechanic:critical"],
    rule: "Solo 1 material con efecto al sacar un 20 natural (regla 1)",
  },
  {
    tags: ["mechanic:extra-damage", "mechanic:condition"],
    rule: "Solo 1 material de daño extra, condición al golpear o efecto al impactar (regla 2)",
  },
  {
    tags: ["mechanic:rune-charges"],
    rule: "Solo 1 material con efecto de runas (regla 3)",
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

/** Devuelve true si agregar esta runa al slot tipo daría violación */
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
