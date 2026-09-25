import type { PlaySpell } from "./play-character.types";

/**
 * Heuristic: spell requires an attack roll (vs save / auto-effect).
 * Catalog text usually includes "spell attack" / "ranged spell attack".
 */
export function spellHasAttackRoll(spell: PlaySpell): boolean {
  const blob = [
    spell.description ?? "",
    spell.higherLevel ?? "",
    spell.name,
  ]
    .join(" ")
    .toLowerCase();
  return (
    /\bspell attack\b/.test(blob) ||
    /\branged spell attack\b/.test(blob) ||
    /\bmelee spell attack\b/.test(blob) ||
    /\bmake (?:a |an )?(?:ranged |melee )?spell attack\b/.test(blob)
  );
}
