import type { Spell } from "@/shared/types";
import type { BuilderSpellSelection } from "@/shared/types";
import { spellNamesMatch } from "./subclass-spells.utils";

/** Extracts the first dice notation (NdX) from a spell's description. */
export function parseSpellDamageRoll(description: string[]): string | null {
  const text = description.join(" ");
  const match = text.match(/\b(\d+d\d+)(?:\s*\+\s*\d+)?\b/i);
  return match ? match[1] : null;
}

export function parseDice(notation: string): { count: number; sides: number } | null {
  const m = notation.match(/^(\d+)d(\d+)$/i);
  if (!m) return null;
  return { count: parseInt(m[1], 10), sides: parseInt(m[2], 10) };
}

export function averageRoll(count: number, sides: number): number {
  return Math.floor(count * ((sides + 1) / 2));
}

export function spellToSelection(spell: Spell): BuilderSpellSelection {
  const damageRoll = parseSpellDamageRoll(spell.description);
  return {
    id: spell.id,
    name: spell.name,
    level: spell.level,
    source: spell.source,
    school: spell.schoolName,
    damageRoll: damageRoll ?? undefined,
  };
}

export function findSpellByName(spells: Spell[], name: string): Spell | undefined {
  return spells.find((s) => spellNamesMatch(s.name, name));
}
