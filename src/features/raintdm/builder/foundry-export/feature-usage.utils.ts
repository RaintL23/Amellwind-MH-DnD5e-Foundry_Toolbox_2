/**
 * Heuristic parser that extracts Foundry dnd5e limited-uses / activation
 * metadata from class-feature / trait / feat description text (5etools tags
 * or already-enriched HTML).
 *
 * Covers the common PHB/XPHB patterns ("you can use this feature twice… Long
 * Rest", "a number of times equal to your Proficiency Bonus", "As a Bonus
 * Action…"). Not a full rules engine — complex resources (Sorcery Points,
 * Ki, etc.) stay as class scale values.
 */

export type FeatureRecoveryPeriod = "lr" | "sr" | "day";

export type FeatureActivationType =
  | "action"
  | "bonus"
  | "reaction"
  | "special"
  | "";

export interface ParsedFeatureUsage {
  activationType: FeatureActivationType;
  activationValue: number | null;
  /** Deterministic Foundry formula for `system.uses.max` (e.g. `"2"`, `"@prof"`). */
  usesMax: string;
  recoveryPeriod: FeatureRecoveryPeriod | "";
}

const ABILITY_TO_KEY: Record<string, string> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
};

const WORD_COUNTS: Record<string, number> = {
  once: 1,
  twice: 2,
  thrice: 3,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/** Strip 5etools tags / HTML so regexes can run on plain prose. */
export function plainFeatureText(raw: string): string {
  return raw
    .replace(/\{@[^}]*\}/g, (tag) => {
      const inner = tag.slice(2, -1);
      const pipe = inner.indexOf("|");
      const body = pipe >= 0 ? inner.slice(0, pipe) : inner;
      const space = body.indexOf(" ");
      return space >= 0 ? body.slice(space + 1) : body;
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseActivation(text: string): {
  type: FeatureActivationType;
  value: number | null;
} {
  // Prefer explicit "as a …" / "take a …" usage costs over incidental mentions.
  // Include 2024 "Utilize" / "Magic" action wrappers (e.g. "As a Utilize action").
  const asMatch = text.match(
    /\b(?:as|take|using)\s+(?:a|an)\s+(?:magic\s+|utilize\s+)?(bonus\s+action|reaction|action)\b/i,
  );
  if (asMatch) {
    const kind = asMatch[1].toLowerCase().replace(/\s+/g, " ");
    if (kind.includes("bonus")) return { type: "bonus", value: 1 };
    if (kind.includes("reaction")) return { type: "reaction", value: 1 };
    return { type: "action", value: 1 };
  }

  const useReaction = text.match(
    /\b(?:use|using|take)\s+your\s+reaction\b/i,
  );
  if (useReaction) return { type: "reaction", value: 1 };

  const useBonus = text.match(
    /\b(?:use|using)\s+(?:a|your)\s+bonus\s+action\b/i,
  );
  if (useBonus) return { type: "bonus", value: 1 };

  return { type: "", value: null };
}

function parseRecovery(text: string): FeatureRecoveryPeriod | "" {
  // Prefer the clause that restores expended uses of *this* feature.
  const regainClause = text.match(
    /regain\s+all\s+expended\s+uses[^.]{0,80}?(long\s+rest|short\s+rest|dawn)/i,
  );
  if (regainClause) {
    const p = regainClause[1].toLowerCase();
    if (p.includes("short")) return "sr";
    if (p.includes("dawn")) return "day";
    return "lr";
  }

  const untilAgain = text.match(
    /can'?t\s+do\s+so\s+again\s+until\s+you\s+finish\s+a\s+(long\s+rest|short\s+rest)/i,
  );
  if (untilAgain) {
    return untilAgain[1].toLowerCase().includes("short") ? "sr" : "lr";
  }

  const oncePer = text.match(
    /\bonce\s+per\s+(long\s+rest|short\s+rest|day)\b/i,
  );
  if (oncePer) {
    const p = oncePer[1].toLowerCase();
    if (p.includes("short")) return "sr";
    if (p === "day") return "day";
    return "lr";
  }

  // "short or long rest" → short rest period (Foundry recovers on short+long).
  if (/\bshort\s+or\s+long\s+rest\b/i.test(text)) return "sr";

  return "";
}

function abilityModFormula(abilityWord: string, minimumOnce: boolean): string {
  const key = ABILITY_TO_KEY[abilityWord.toLowerCase()];
  if (!key) return "";
  const base = `@abilities.${key}.mod`;
  return minimumOnce ? `max(1, ${base})` : base;
}

function parseUsesMax(text: string): string {
  // "a number of times equal to your Proficiency Bonus"
  if (
    /number\s+of\s+times\s+equal\s+to\s+your\s+proficiency\s+bonus/i.test(text)
  ) {
    return "@prof";
  }

  // "a number of times equal to your Charisma modifier (minimum of once)"
  const abilityTimes = text.match(
    /number\s+of\s+times\s+equal\s+to\s+your\s+(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+modifier(\s*\([^)]*minimum[^)]*\))?/i,
  );
  if (abilityTimes) {
    const minOnce = Boolean(abilityTimes[2]) || /minimum\s+of\s+once/i.test(text);
    return abilityModFormula(abilityTimes[1], minOnce);
  }

  // "You can use this feature twice" / "use this trait once"
  const wordCount = text.match(
    /\b(?:use\s+this\s+(?:feature|trait|ability)|you\s+can\s+use\s+(?:this|it))\s+(once|twice|thrice|one|two|three|four|five|six)\b/i,
  );
  if (wordCount) {
    const n = WORD_COUNTS[wordCount[1].toLowerCase()];
    if (n) return String(n);
  }

  // "You can use this feature 3 times"
  const digitCount = text.match(
    /\b(?:use\s+this\s+(?:feature|trait|ability)|you\s+can\s+use\s+(?:this|it))\s+(\d+)\s+times?\b/i,
  );
  if (digitCount) return digitCount[1];

  // "You can rage twice" / class-specific "You can X N times"
  const namedWord = text.match(
    /\byou\s+can\s+[a-z][a-z\s]{0,40}?\s+(once|twice|thrice)\b/i,
  );
  if (namedWord) {
    const n = WORD_COUNTS[namedWord[1].toLowerCase()];
    if (n) return String(n);
  }

  // Gear kits: "A Healer's Kit has ten uses" / "has 10 uses"
  const hasUses = text.match(
    /\bhas\s+(once|twice|thrice|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+uses?\b/i,
  );
  if (hasUses) {
    const token = hasUses[1].toLowerCase();
    if (WORD_COUNTS[token]) return String(WORD_COUNTS[token]);
    if (/^\d+$/.test(token)) return token;
  }

  // "Once you use this feature, you can't do so again until…"
  if (
    /\bonce\s+you\s+use\s+this\s+(?:feature|trait|ability)\b/i.test(text) ||
    /\bonce\s+per\s+(?:long\s+rest|short\s+rest|day)\b/i.test(text)
  ) {
    return "1";
  }

  // "regain … when you finish a Long Rest" alone does not imply a use count.
  return "";
}

/**
 * Parse activation / limited uses / recovery from a feature description.
 * Returns empty fields when nothing reliable is found (passive traits).
 */
export function parseFeatureUsage(description: string | undefined): ParsedFeatureUsage {
  const empty: ParsedFeatureUsage = {
    activationType: "",
    activationValue: null,
    usesMax: "",
    recoveryPeriod: "",
  };
  if (!description?.trim()) return empty;

  const text = plainFeatureText(description);
  if (!text) return empty;

  // Activation is usually stated up front; scanning the whole body false-positives
  // nested options (e.g. Font of Magic → Creating Spell Slots as a Bonus Action).
  const activation = parseActivation(text.slice(0, 480));
  const usesMax = parseUsesMax(text);
  let recoveryPeriod = parseRecovery(text);

  // If we found uses but no explicit recovery, default to long rest (most common).
  if (usesMax && !recoveryPeriod) {
    recoveryPeriod = "lr";
  }

  // "once per long rest" style may set recovery without an explicit count.
  let max = usesMax;
  if (!max && recoveryPeriod && /\bonce\s+per\s+/i.test(text)) {
    max = "1";
  }

  return {
    activationType: activation.type,
    activationValue: activation.value,
    usesMax: max,
    recoveryPeriod,
  };
}

/** True when the feature should expose a clickable Foundry activity. */
export function featureNeedsActivity(usage: ParsedFeatureUsage): boolean {
  return Boolean(usage.activationType || usage.usesMax);
}
