import { SKILL_NAME_TO_KEY } from "@/shared/constants/dnd/skills.constants";
import { Rune, RuneSlot, RuneTier } from "@/shared/types";
import { flattenEntriesForDisplay } from "@/shared/utils/fivetools-parser";
import {
  formatCrDisplay,
  getBaseCr,
  getCrValues,
  parseCR,
} from "@/shared/utils/cr.utils";
import {
  resolveSpellLevelsFromText,
  spellTagsFromLevels,
  type SpellLevelLookup,
} from "../utils/spell-level-lookup.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

// ─── CR / Tier helpers ────────────────────────────────────────────────────────

function crToTier(cr: unknown): RuneTier {
  const n = parseCR(getBaseCr(cr));
  if (n <= 4) return 1;
  if (n <= 10) return 2;
  if (n <= 16) return 3;
  return 4;
}

// ─── Slot parsing ─────────────────────────────────────────────────────────────

function parseSlots(slotsStr: string): RuneSlot[] {
  const slots: RuneSlot[] = [];
  if (slotsStr.includes("A")) slots.push("A");
  if (slotsStr.includes("W")) slots.push("W");
  return slots;
}

// ─── Effects indexer ──────────────────────────────────────────────────────────

function indexEffectsByName(items: unknown[]): Record<string, string> {
  const index: Record<string, string> = {};
  if (!Array.isArray(items)) return index;
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const i = item as Raw;
    const name = String(i.name ?? "");
    const entries = Array.isArray(i.entries) ? i.entries : [];
    index[name] = flattenEntriesForDisplay(entries);
  }
  return index;
}

// ─── Tag extraction ───────────────────────────────────────────────────────────

const CLASS_PATTERNS: Array<[RegExp, string]> = [
  [/spellcaster only/i, "class:spellcaster"],
  [/Monk only/i, "class:monk"],
  [/\bDruid\b.*only/i, "class:druid"],
  [/\bSorcerer\b.*only/i, "class:sorcerer"],
  [/\bWarlock\b.*only/i, "class:warlock"],
  [/\bWizard\b.*only/i, "class:wizard"],
  [/\bCleric\b.*only/i, "class:cleric"],
  [/\bPaladin\b.*only/i, "class:paladin"],
  [/\bRanger\b.*only/i, "class:ranger"],
  [/artificer.*only/i, "class:artificer"],
  [/\bBard\b.*only/i, "class:bard"],
  [/\bBarbarian\b.*only/i, "class:barbarian"],
  [/\bFighter\b.*only/i, "class:fighter"],
  [/\bRogue\b.*only/i, "class:rogue"],
];

const WEAPON_TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/Bladed Weapon only/i, "weapon-type:bladed"],
  [/Melee Weapon only/i, "weapon-type:melee"],
  [/Ranged weapon only/i, "weapon-type:ranged"],
  [/Insect Glaive only/i, "weapon-type:insect-glaive"],
  [/Greatsword.*only/i, "weapon-type:greatsword"],
  [/\bLance\b.*only/i, "weapon-type:lance"],
  [/Bow only/i, "weapon-type:bow"],
  [/Gunlance only/i, "weapon-type:gunlance"],
  [/Hammer.*only/i, "weapon-type:hammer"],
  [/[Cc]harge [Bb]lade.*only/i, "weapon-type:charge-blade"],
  [/switchaxe.*only/i, "weapon-type:switchaxe"],
];

// mechanic:extra-damage, mechanic:healing y mechanic:spell se emiten vía
// funciones de escala en lugar de patrones simples.
const MECHANIC_PATTERNS: Array<[RegExp, string]> = [
  [/\d+\s*runes?|runes?\s*\d+/i, "mechanic:rune-charges"],
  [/critical|roll(?:s|ing)? a 20 (?:on |for )?(?:your |an |the )?attack roll|natural 20/i, "mechanic:critical"],
  [/resist(?:ant|ance) to\s+\w/i, "mechanic:resistance"],
  [/immune to|immunity to/i, "mechanic:immunity"],
  [
    /(?:reduce|reduces) (?:the |that |any )?damage(?: you take)? (?:by|to)/i,
    "mechanic:damage-reduction",
  ],
  [/damage (?:you take )?is reduced (?:by|to)/i, "mechanic:damage-reduction"],
  [
    /when you (?:take|would take)(?: \w+)* damage[^.]*reduce/i,
    "mechanic:damage-reduction",
  ],
  [/bonus action/i, "mechanic:bonus-action"],
  [/\breaction\b/i, "mechanic:reaction"],
  [
    /saving throw.*(?:advantage|disadvantage)|(?:advantage|disadvantage).*saving throw/i,
    "mechanic:saving-throw",
  ],
  [/\+\d+\s*bonus\s+(?:on|to).*\{@skill/i, "mechanic:skill-bonus"],
  [/\bAC\b|armor class/i, "mechanic:ac"],
  [
    /\{@condition|(?:immune|immunity) to (?:the )?\w+ condition/i,
    "mechanic:condition",
  ],
  [/\bdiseases?\b/i, "mechanic:disease"],
  [/(?:movement|speed|jump)\s+(?:increase|by|\d+)/i, "mechanic:movement"],
  [/\badvantage\b/i, "mechanic:advantage"],
  [/\bcantrip\b/i, "mechanic:cantrip"],
  [
    /wyvernfire|dragonpiercer|Guard AC|Mighty Weapon/i,
    "mechanic:class-feature",
  ],
  // Regeneración de extremidades / partes del cuerpo (efecto de curación mayor distinto del HP)
  [/(?:regrow|missing part.*grow|body part.*grow|limb.*regrow)/i, "mechanic:regeneration"],
  // Recarga o uso ligado a descansos
  [/\bshort(?:\s+or\s+long)?\s+rest\b|\{@rest\s+short\}/i, "mechanic:short-rest"],
  [/\b(?:short\s+or\s+)?long\s+rest\b|\{@rest\s+long\}/i, "mechanic:long-rest"],
];

const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

/** damage:fire, damage:cold, etc. — cualquier mención explícita del tipo de daño. */
function damageTypeTags(text: string): string[] {
  const tags: string[] = [];
  for (const type of DAMAGE_TYPES) {
    const mentionsType =
      new RegExp(`\\b${type}\\s+damage\\b`, "i").test(text) ||
      new RegExp(`resist(?:ant|ance) to\\s+${type}\\b`, "i").test(text) ||
      new RegExp(`immune(?:ity)? to\\s+${type}\\b`, "i").test(text) ||
      new RegExp(`vulnerab(?:le|ility) to\\s+${type}\\b`, "i").test(text);
    if (mentionsType) tags.push(`damage:${type}`);
  }
  return tags;
}

/**
 * mechanic:skill-insight, mechanic:skill-animal-handling, etc.
 * One tag per `{@skill Name}` referenced in the effect text.
 */
function skillTags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(/\{@skill\s+([^}|]+)/gi)) {
    const name = (match[1] ?? "").trim().toLowerCase();
    if (!name || !(name in SKILL_NAME_TO_KEY)) continue;
    tags.add(`mechanic:skill-${name.replace(/\s+/g, "-")}`);
  }
  return Array.from(tags);
}

/**
 * mechanic:condition-stunned, mechanic:condition-frenzy-virus, etc.
 * From `{@condition Name}` and "immune to the ___ condition" wording.
 * Keeps the generic `mechanic:condition` pattern for broad filters / build rules.
 */
function conditionNameTags(text: string): string[] {
  const tags = new Set<string>();

  const add = (raw: string) => {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    tags.add(`mechanic:condition-${name.replace(/\s+/g, "-")}`);
  };

  for (const match of text.matchAll(/\{@condition\s+([^}|]+)/gi)) {
    add(match[1] ?? "");
  }
  for (const match of text.matchAll(
    /(?:immune|immunity) to (?:the )?([a-z][a-z\s-]{0,40}?) condition/gi,
  )) {
    add(match[1] ?? "");
  }

  return Array.from(tags);
}

/**
 * mechanic:against-condition — defensive protection vs suffering a condition
 * (advantage on saves against being X, immunity to a condition, etc.).
 * Does not cover weapon effects that inflict a condition on hit.
 */
function againstConditionTag(text: string): string | null {
  if (
    /(?:immune|immunity) to (?:the )?(?:\{@condition|[a-z][\w\s-]{0,40}? condition)/i.test(
      text,
    )
  ) {
    return "mechanic:against-condition";
  }

  if (/saving throws? against being/i.test(text)) {
    return "mechanic:against-condition";
  }

  // e.g. "saving throw or be knocked {@condition prone}, you do so with advantage"
  if (
    /\badvantage\b/i.test(text) &&
    /(?:against being|or be (?:knocked )?|or become )/i.test(text) &&
    /\{@condition/i.test(text)
  ) {
    return "mechanic:against-condition";
  }

  return null;
}

// ─── Scaled sub-tag extractors ────────────────────────────────────────────────

/**
 * Retorna el mayor producto num×size de todas las expresiones XdY en el texto.
 * Ejemplo: "extra 2d6" → 12; "extra 1d4" → 4.
 */
function parseLargestDiceScore(text: string): number {
  const matches = [...text.matchAll(/(\d+)d(\d+)/gi)];
  if (!matches.length) return 0;
  return Math.max(...matches.map(([, n, s]) => parseInt(n) * parseInt(s)));
}

/**
 * mechanic:extra-damage:minor  → 1d4 – 1d6, or flat ≤ 6  (score ≤ 6)
 * mechanic:extra-damage:major  → 1d8 / 2d6+, or flat > 6 (score > 6)
 * Also matches flat extras like "extra 1 slashing damage".
 */
function extraDamageTag(text: string): string | null {
  if (!/extra (?:\{@damage|\d+)/i.test(text)) return null;
  const diceScore = parseLargestDiceScore(text);
  if (diceScore > 0) {
    return diceScore > 6
      ? "mechanic:extra-damage:major"
      : "mechanic:extra-damage:minor";
  }
  const flat = text.match(/extra (\d+)\s+\w+\s+damage/i);
  const amount = flat ? parseInt(flat[1], 10) : 0;
  return amount > 6
    ? "mechanic:extra-damage:major"
    : "mechanic:extra-damage:minor";
}

/**
 * mechanic:healing:minor → 1d4 – 1d6 o cantidad fija ≤ 10
 * mechanic:healing:major → 1d8+ / 2d6+ o cantidad fija > 10,
 *                          o cualquier efecto de regeneración de extremidades
 */
function healingTag(text: string): string | null {
  // Regeneración de partes del cuerpo: aunque el HP sea bajo, es un efecto major
  if (/(?:regrow|missing part.*grow|body part.*grow|limb.*regrow)/i.test(text)) {
    return "mechanic:healing:major";
  }
  if (!/(?:regain|restore)\s+\d+.*hit points/i.test(text)) return null;
  const diceScore = parseLargestDiceScore(text);
  if (diceScore > 0) {
    return diceScore > 6 ? "mechanic:healing:major" : "mechanic:healing:minor";
  }
  // Cantidad fija de HP sin dados
  const fixed = text.match(/(?:regain|restore)\s+(\d+)\s+(?:hit points|hp)/i);
  const amount = fixed ? parseInt(fixed[1]) : 0;
  return amount > 10 ? "mechanic:healing:major" : "mechanic:healing:minor";
}

/**
 * mechanic:spell-buff:damage → bonus/advantage a spell attack rolls o daño de hechizos
 * mechanic:spell-buff:save   → bonus/incremento al spell save DC
 */
function spellBuffTags(text: string): string[] {
  const tags: string[] = [];
  const hasBuffLanguage =
    /\+\d+\s*bonus|\badvantage\b|increase(?:s|d)?\s+by/i.test(text);

  if (!hasBuffLanguage) return tags;

  const targetsSaveDc =
    /spell save\s+DC/i.test(text) ||
    (/when you cast a spell/i.test(text) && /save\s+DC/i.test(text));

  const targetsDamageOrAttack =
    /spell attack\s+roll|spell damage|damage roll/i.test(text) ||
    (/when you cast a spell/i.test(text) && !/save\s+DC/i.test(text));

  if (targetsSaveDc) tags.push("mechanic:spell-buff:save");
  if (targetsDamageOrAttack) tags.push("mechanic:spell-buff:damage");

  return tags;
}

/**
 * Resolves spell tags from the spell catalog when possible.
 * Fallback heuristic when the spell is unknown / lookup missing:
 * - mechanic:spell:lvl3+ for 3rd+ language or costly runes
 * - mechanic:spell:lvl1-2 otherwise (except cantrip-only text)
 */
function spellTags(
  text: string,
  spellLevels?: SpellLevelLookup | null,
): string[] {
  if (!/\{@spell/i.test(text)) return [];

  const lookedUp = spellTagsFromLevels(
    resolveSpellLevelsFromText(text, spellLevels),
  );
  if (lookedUp.length > 0) return lookedUp;

  if (/\b[3-9](?:rd|th)-level\b/i.test(text)) return ["mechanic:spell:lvl3+"];

  const runeMatches = [
    ...text.matchAll(/\{@spell[^}]+\}\s*\((\d+)\s*runes?\)/gi),
  ];
  if (runeMatches.some((m) => parseInt(m[1], 10) >= 3)) {
    return ["mechanic:spell:lvl3+"];
  }

  const hasLeveledSpellLanguage =
    /\b[12](?:st|nd)-level\b/i.test(text) || runeMatches.length > 0;

  if (/\bcantrip\b/i.test(text) && !hasLeveledSpellLanguage) {
    return [];
  }

  return ["mechanic:spell:lvl1-2"];
}

/**
 * type:offensive  → más daño (extra damage, críticos, buffs de ataque/daño)
 * type:defensive  → menos daño recibido o bonus de AC
 * type:support    → ayuda a aliados o menciona criaturas willing
 */
function typeTags(text: string): string[] {
  const tags: string[] = [];

  if (/willing creature/i.test(text)) {
    tags.push("type:support");
  } else if (
    /(?:another|friendly|allied|ally|allies)\s+(?:creature|target)/i.test(text) &&
    /(?:regain|restore|grant|give|heal|advantage on|temporary hit points)/i.test(
      text,
    )
  ) {
    tags.push("type:support");
  }

  const isDefensive =
    /\bAC\b|armor class/i.test(text) ||
    /resist(?:ant|ance) to\s+\w/i.test(text) ||
    /immune to|immunity to/i.test(text) ||
    /(?:reduce|reduces) (?:the |that |any )?damage(?: you take)? (?:by|to)/i.test(
      text,
    ) ||
    /damage (?:you take )?is reduced (?:by|to)/i.test(text) ||
    /when you (?:take|would take)(?: \w+)* damage[^.]*reduce/i.test(text) ||
    /Guard AC/i.test(text) ||
    (/saving throw/i.test(text) &&
      /\badvantage\b/i.test(text) &&
      !/\bdisadvantage\b/i.test(text));

  if (isDefensive) tags.push("type:defensive");

  const isOffensive =
    /extra (?:\{@damage|\d+d\d+)/i.test(text) ||
    /\bcritical\b/i.test(text) ||
    /roll(?:s|ing)? a 20 (?:on |for )?(?:your |an |the )?attack roll|natural 20/i.test(
      text,
    ) ||
    /\+\d+\s*bonus.*(?:attack|damage)/i.test(text) ||
    /(?:attack|damage) roll.*\+\d+/i.test(text) ||
    /spell attack\s+roll|spell damage|damage roll/i.test(text) ||
    (/\{@condition/i.test(text) && /(?:hit|attack|strike|on a hit)/i.test(text)) ||
    /(?:deals?|extra|takes?)\s+(?:\{@damage\s+)?\d+d\d+/i.test(text) ||
    (/\{@spell/i.test(text) && /deals?\s+\w+\s+damage/i.test(text));

  if (isOffensive) tags.push("type:offensive");

  return tags;
}

function extractTags(
  effectText: string,
  spellLevels?: SpellLevelLookup | null,
): string[] {
  const tags = new Set<string>();

  for (const [pattern, tag] of CLASS_PATTERNS) {
    if (pattern.test(effectText)) tags.add(tag);
  }
  for (const [pattern, tag] of WEAPON_TYPE_PATTERNS) {
    if (pattern.test(effectText)) tags.add(tag);
  }
  for (const [pattern, tag] of MECHANIC_PATTERNS) {
    if (pattern.test(effectText)) tags.add(tag);
  }

  // Sub-tags escalados (reemplazan los genéricos)
  const dmg = extraDamageTag(effectText);
  if (dmg) tags.add(dmg);

  const heal = healingTag(effectText);
  if (heal) tags.add(heal);

  for (const spell of spellTags(effectText, spellLevels)) {
    tags.add(spell);
  }

  for (const buffTag of spellBuffTags(effectText)) {
    tags.add(buffTag);
  }

  for (const typeTag of typeTags(effectText)) {
    tags.add(typeTag);
  }

  for (const damageTag of damageTypeTags(effectText)) {
    tags.add(damageTag);
  }

  for (const skillTag of skillTags(effectText)) {
    tags.add(skillTag);
  }

  for (const conditionTag of conditionNameTags(effectText)) {
    tags.add(conditionTag);
  }

  const againstCondition = againstConditionTag(effectText);
  if (againstCondition) tags.add(againstCondition);

  return Array.from(tags);
}

/** Exported for unit tests and shared tag previews. */
export function extractRuneEffectTags(
  effectText: string,
  spellLevels?: SpellLevelLookup | null,
): string[] {
  return extractTags(effectText, spellLevels);
}

// ─── Main mapper ─────────────────────────────────────────────────────────────

/** Busca recursivamente un objeto `{ type: "inset" }` dentro de un array de entries. */
function findInset(entries: unknown[]): Raw | undefined {
  for (const e of entries) {
    if (typeof e !== "object" || e === null) continue;
    const obj = e as Raw;
    if (obj.type === "inset") return obj;
    if (Array.isArray(obj.entries)) {
      const found = findInset(obj.entries as unknown[]);
      if (found) return found;
    }
  }
  return undefined;
}

export function mapRunesFromMonster(
  rawMonster: Raw,
  spellLevels?: SpellLevelLookup | null,
): Rune[] {
  const fluff = rawMonster?.fluff;
  if (!fluff || !Array.isArray(fluff.entries)) return [];

  const inset = findInset(fluff.entries as unknown[]);
  if (!inset || !Array.isArray(inset.entries)) return [];

  const tables = inset.entries.filter((e: Raw) => e.type === "table") as Raw[];
  const lootTable = tables.find((t) => t.colLabels?.[0] === "Carve Chance");
  const headerTable = tables.find((t) => !t.colLabels);

  if (!lootTable || !Array.isArray(lootTable.rows)) return [];

  const lists = inset.entries.filter((e: Raw) => e.type === "list") as Raw[];
  const armorList = lists.find((l) => l.name === "ARMOR MATERIAL EFFECTS");
  const weaponList = lists.find((l) => l.name === "WEAPON MATERIAL EFFECTS");

  const armorEffects = indexEffectsByName(armorList?.items ?? []);
  const weaponEffects = indexEffectsByName(weaponList?.items ?? []);

  const rolls = parseInt(String(headerTable?.rows?.[0]?.[3] ?? "0")) || 0;

  // Detectar si la tabla tiene 4 columnas (Carve, Capture, Material, Slots)
  // o 3 columnas (Carve, Material, Slots) — sin columna de captura.
  const hasCapture = (lootTable.colLabels as string[]).length >= 4;

  const runes: Rune[] = [];

  for (const row of lootTable.rows as unknown[][]) {
    let carveChance: string;
    let captureChance: string;
    let name: string;
    let slotsStr: string;

    if (hasCapture) {
      carveChance = String(row[0] ?? "-");
      captureChance = String(row[1] ?? "-");
      name = String(row[2] ?? "");
      slotsStr = String(row[3] ?? "");
    } else {
      carveChance = String(row[0] ?? "-");
      captureChance = "-";
      name = String(row[1] ?? "");
      slotsStr = String(row[2] ?? "");
    }

    if (!name) continue;

    const slots = parseSlots(slotsStr);
    const armorEffect = armorEffects[name] ?? null;
    const weaponEffect = weaponEffects[name] ?? null;

    const weaponTags = weaponEffect
      ? extractTags(weaponEffect, spellLevels)
      : [];
    const armorTags = armorEffect
      ? extractTags(armorEffect, spellLevels)
      : [];
    const tags = Array.from(new Set([...weaponTags, ...armorTags]));

    runes.push({
      name,
      monsterName: String(rawMonster.name ?? ""),
      monsterSource: String(rawMonster.source ?? ""),
      monsterCr: formatCrDisplay(rawMonster.cr),
      monsterCrs: getCrValues(rawMonster.cr),
      tier: crToTier(rawMonster.cr),
      carveChance,
      captureChance,
      rolls,
      slots,
      armorEffect,
      weaponEffect,
      tags,
      weaponTags,
      armorTags,
    });
  }
  // console.log(runes);

  return runes;
}
