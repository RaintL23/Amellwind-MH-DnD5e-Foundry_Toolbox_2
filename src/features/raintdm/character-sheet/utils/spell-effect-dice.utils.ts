import type { PlaySpell } from "./play-character.types";

const DIE_RE = /(\d*)d(\d+)/i;

export type SpellEffectKind = "heal" | "damage";

export interface SpellEffectRoll {
  expression: string;
  kind: SpellEffectKind;
  label: string;
}

function normalizeDie(raw: string): string | null {
  const m = DIE_RE.exec(raw.trim());
  if (!m) return null;
  const count = Math.max(1, parseInt(m[1] || "1", 10));
  const sides = parseInt(m[2]!, 10);
  if (!Number.isFinite(sides) || sides < 1) return null;
  return `${count}d${sides}`;
}

function parseDie(raw: string): { count: number; sides: number } | null {
  const n = normalizeDie(raw);
  if (!n) return null;
  const m = /^(\d+)d(\d+)$/i.exec(n);
  if (!m) return null;
  return { count: parseInt(m[1]!, 10), sides: parseInt(m[2]!, 10) };
}

/** Add `times` copies of `extra` onto `base` when both share the same die size. */
export function combineDice(
  base: string,
  extra: string,
  times: number,
): string {
  if (times <= 0) return base;
  const a = parseDie(base);
  const b = parseDie(extra);
  if (!a || !b) return base;
  if (a.sides !== b.sides) {
    // Different dice — append as separate terms (rare for PHB spells).
    const parts = [base];
    for (let i = 0; i < times; i++) parts.push(extra);
    return parts.join("+");
  }
  return `${a.count + b.count * times}d${a.sides}`;
}

function extractUpcastDie(higherLevel: string | undefined): string | null {
  if (!higherLevel) return null;
  const m = higherLevel.match(
    /increases\s+by\s+(\d*d\d+)\s+for\s+each/i,
  );
  return m ? normalizeDie(m[1]!) : null;
}

/**
 * Cantrip level bands from text like:
 * "when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8)".
 */
function cantripDiceAtLevel(
  description: string,
  baseDice: string,
  characterLevel: number,
): string {
  const tiers: { level: number; dice: string }[] = [];
  for (const m of description.matchAll(
    /(\d+)(?:st|nd|rd|th)\s+level\s*\((\d*d\d+)\)/gi,
  )) {
    const die = normalizeDie(m[2]!);
    if (!die) continue;
    tiers.push({ level: parseInt(m[1]!, 10), dice: die });
  }
  tiers.sort((a, b) => a.level - b.level);
  let dice = baseDice;
  for (const t of tiers) {
    if (characterLevel >= t.level) dice = t.dice;
  }
  return dice;
}

interface PrimaryEffect {
  dice: string;
  includeSpellMod: boolean;
  flatBonus: number;
  kind: SpellEffectKind;
}

/**
 * Pull the cast-time heal/damage die from plain spell text.
 * Skips buff dice ("can roll a d4 and add") that are not cast-time effects.
 */
function extractPrimaryEffect(description: string): PrimaryEffect | null {
  const text = description;
  if (!text.trim()) return null;

  // Heal with spellcasting mod: "equal to 1d4 + your spellcasting ability modifier"
  const healMod = text.match(
    /(?:regains?|heals?|hit\s+points|hp)\b[^.]{0,120}?(\d*d\d+)[^.]{0,80}?spellcasting\s+ability\s+modifier/i,
  );
  if (healMod) {
    const dice = normalizeDie(healMod[1]!);
    if (dice) {
      return {
        dice,
        includeSpellMod: true,
        flatBonus: 0,
        kind: "heal",
      };
    }
  }

  // Heal without mod: "regains hit points equal to 2d8"
  const heal = text.match(
    /(?:regains?|heals?)\b[^.]{0,120}?(\d*d\d+)/i,
  );
  if (heal) {
    const dice = normalizeDie(heal[1]!);
    if (dice) {
      const window = text.slice(heal.index ?? 0, (heal.index ?? 0) + 160);
      return {
        dice,
        includeSpellMod: /spellcasting\s+ability\s+modifier/i.test(window),
        flatBonus: 0,
        kind: "heal",
      };
    }
  }

  // Damage: "takes 8d6 fire damage" / "deals 1d4 + 1 force damage"
  // Prefer the first damage mention; ignore later cantrip-scaling parentheticals
  // by stopping at the first sentence that clearly deals damage.
  const dmg = text.match(
    /(?:takes?|deals?|deal)\b[^.]{0,100}?(\d*d\d+)(?:\s*\+\s*(\d+))?[^.]{0,40}?damage/i,
  );
  if (dmg) {
    const dice = normalizeDie(dmg[1]!);
    if (dice) {
      const flatBonus = dmg[2] ? parseInt(dmg[2], 10) : 0;
      return {
        dice,
        includeSpellMod: /spellcasting\s+ability\s+modifier/i.test(
          text.slice(dmg.index ?? 0, (dmg.index ?? 0) + 120),
        ),
        flatBonus: Number.isFinite(flatBonus) ? flatBonus : 0,
        kind: "damage",
      };
    }
  }

  // Fallback: "NdS … damage" without takes/deals (e.g. "8d6 fire damage on a failed save")
  const dmgLoose = text.match(/(\d*d\d+)(?:\s*\+\s*(\d+))?[^.]{0,40}?damage/i);
  if (dmgLoose) {
    const dice = normalizeDie(dmgLoose[1]!);
    if (dice) {
      const flatBonus = dmgLoose[2] ? parseInt(dmgLoose[2], 10) : 0;
      return {
        dice,
        includeSpellMod: false,
        flatBonus: Number.isFinite(flatBonus) ? flatBonus : 0,
        kind: "damage",
      };
    }
  }

  return null;
}

function formatExpression(
  dice: string,
  flatBonus: number,
  spellMod: number,
  includeSpellMod: boolean,
): string {
  let expr = dice;
  if (flatBonus > 0) expr += `+${flatBonus}`;
  else if (flatBonus < 0) expr += `${flatBonus}`;
  if (includeSpellMod && spellMod !== 0) {
    expr += spellMod >= 0 ? `+${spellMod}` : `${spellMod}`;
  }
  return expr;
}

/**
 * Build the dice expression to roll when casting a spell (heal / damage).
 * Returns null when the spell has no cast-time dice (buffs, utility, …).
 */
export function resolveSpellEffectRoll(
  spell: PlaySpell,
  opts: {
    slotLevel: number;
    spellMod: number;
    characterLevel: number;
  },
): SpellEffectRoll | null {
  const description = spell.description ?? "";
  const primary = extractPrimaryEffect(description);
  if (!primary) return null;

  let dice = primary.dice;
  if (spell.level === 0) {
    dice = cantripDiceAtLevel(
      description,
      dice,
      Math.max(1, opts.characterLevel),
    );
  } else {
    const upDie = extractUpcastDie(spell.higherLevel);
    const steps = Math.max(0, opts.slotLevel - spell.level);
    if (upDie && steps > 0) {
      dice = combineDice(dice, upDie, steps);
    }
  }

  const expression = formatExpression(
    dice,
    primary.flatBonus,
    opts.spellMod,
    primary.includeSpellMod,
  );

  return {
    expression,
    kind: primary.kind,
    label: primary.kind === "heal" ? "Heal" : "Damage",
  };
}
