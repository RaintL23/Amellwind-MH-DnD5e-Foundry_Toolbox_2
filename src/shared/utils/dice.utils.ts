/**
 * Dice expression parsing and rolling for session play.
 */

export type DiceRollMode = "normal" | "advantage" | "disadvantage";

export interface ParsedDiceTerm {
  count: number;
  sides: number;
}

export interface ParsedDiceExpression {
  terms: ParsedDiceTerm[];
  modifier: number;
  raw: string;
}

export interface RollResult {
  total: number;
  detail: string;
  rolls: number[];
  modifier: number;
  mode: DiceRollMode;
  critical?: boolean;
}

const DICE_RE = /([+-]?)(\d*)d(\d+)/gi;
const MOD_RE = /([+-]\d+)(?!d)/g;

export function parseDiceExpression(raw: string): ParsedDiceExpression | null {
  const cleaned = raw.replace(/\s+/g, "").toLowerCase();
  if (!cleaned) return null;

  const terms: ParsedDiceTerm[] = [];
  let matched = false;
  let expr = cleaned;

  expr = expr.replace(DICE_RE, (_m, sign: string, countStr: string, sidesStr: string) => {
    matched = true;
    const count = Math.max(1, parseInt(countStr || "1", 10));
    const sides = parseInt(sidesStr, 10);
    if (!Number.isFinite(sides) || sides < 1) return "";
    const signedCount = sign === "-" ? -count : count;
    terms.push({ count: signedCount, sides });
    return "";
  });

  let modifier = 0;
  // leftover flat mods or pure number
  const leftover = expr.replace(MOD_RE, (m) => {
    modifier += parseInt(m, 10);
    return "";
  });
  if (/^-?\d+$/.test(leftover)) {
    modifier += parseInt(leftover, 10);
    matched = true;
  } else if (leftover.replace(/[+-]/g, "").length > 0) {
    // garbage left
    if (!matched) return null;
  }

  if (!matched && terms.length === 0 && modifier === 0) return null;
  return { terms, modifier, raw };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll a dice expression. For d20 with advantage/disadvantage, pass a single d20 term.
 * `critical` doubles dice counts (weapon damage crit), not modifiers.
 */
export function rollExpression(
  expression: string,
  options: { mode?: DiceRollMode; critical?: boolean } = {},
): RollResult {
  const mode = options.mode ?? "normal";
  const parsed = parseDiceExpression(expression);
  if (!parsed) {
    return {
      total: 0,
      detail: `Invalid: ${expression}`,
      rolls: [],
      modifier: 0,
      mode,
    };
  }

  const rolls: number[] = [];
  const parts: string[] = [];
  let total = parsed.modifier;

  for (const term of parsed.terms) {
    const absCount = Math.abs(term.count) * (options.critical ? 2 : 1);
    const sign = term.count < 0 ? -1 : 1;
    const termRolls: number[] = [];

    if (
      absCount === 1 &&
      term.sides === 20 &&
      mode !== "normal" &&
      !options.critical
    ) {
      const a = rollDie(20);
      const b = rollDie(20);
      const picked = mode === "advantage" ? Math.max(a, b) : Math.min(a, b);
      termRolls.push(a, b);
      rolls.push(picked);
      total += sign * picked;
      parts.push(
        `${sign < 0 ? "-" : ""}d20[${a},${b}→${picked}] (${mode})`,
      );
      continue;
    }

    for (let i = 0; i < absCount; i++) {
      const r = rollDie(term.sides);
      termRolls.push(r);
      rolls.push(r);
      total += sign * r;
    }
    const label = `${sign < 0 ? "-" : ""}${absCount}d${term.sides}`;
    parts.push(`${label}[${termRolls.join(",")}]`);
  }

  if (parsed.modifier !== 0) {
    parts.push(
      parsed.modifier > 0 ? `+${parsed.modifier}` : `${parsed.modifier}`,
    );
  }

  return {
    total,
    detail: parts.join(" ") || String(total),
    rolls,
    modifier: parsed.modifier,
    mode,
    critical: options.critical,
  };
}

/** Roll a plain d20 with optional advantage/disadvantage. */
export function rollD20(mode: DiceRollMode = "normal"): RollResult {
  return rollExpression("1d20", { mode });
}
