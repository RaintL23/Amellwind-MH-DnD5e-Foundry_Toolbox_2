import type { Spell } from "@/shared/types";

const DAMAGE_TYPE_NAMES =
  "acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder";

export { DAMAGE_TYPE_NAMES };

/** Whether spell text describes dealing damage (any spell level). */
export function isDamageSpell(spell: Spell): boolean {
  const text = [...spell.description, spell.higherLevel ?? "", spell.summary]
    .filter(Boolean)
    .join(" ");

  const damagePattern = new RegExp(
    `\\d+d\\d+[^.]{0,48}(?:${DAMAGE_TYPE_NAMES})\\s+damage`,
    "i",
  );
  if (damagePattern.test(text)) return true;
  if (/spell attack/i.test(text) && /damage/i.test(text)) return true;
  return /saving throw/i.test(text) && /\d+d\d+/.test(text);
}

export function isDamageCantrip(spell: Spell): boolean {
  return spell.level === 0 && isDamageSpell(spell);
}
