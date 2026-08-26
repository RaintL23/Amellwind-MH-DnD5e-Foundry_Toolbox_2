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

/**
 * Materials with loot slot "O" (Other) — upgrade bones, crafting mats, sellables —
 * parse to empty `slots` and are not placeable as Armor/Weapon/Trinket runes.
 * Also excludes materials that only carry an otherEffect (consumables, crafting
 * ingredients, etc.) since they have no equippable armor or weapon effect.
 */
export function isPlaceableRune(
  rune: Pick<Rune, "slots" | "armorEffect" | "weaponEffect">,
): boolean {
  return rune.slots.length > 0 && (!!rune.armorEffect || !!rune.weaponEffect);
}

/** Normalize loot-table dash variants (em/en dash) to ASCII "-". */
export function normalizeLootChance(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "-";
  if (/^[—–―−‐-]+$/.test(trimmed)) return "-";
  return trimmed;
}

/**
 * Strip quantity multipliers from loot material names
 * (`B.Sleep Sac x2`, `2x Paddock Cream`, `Elder Dragon Blood X2` → base name).
 */
export function stripMaterialQuantity(name: string): string {
  return name
    .replace(/^\d+\s*x\s+/i, "")
    .replace(/\s*x\s*\d+\s*$/i, "")
    .trim();
}

function preferShorterEffect(
  map: Map<string, string>,
  key: string,
  effect: string,
): void {
  const prev = map.get(key);
  if (!prev || effect.length < prev.length) map.set(key, effect);
}

/**
 * Shared O-slot materials (Raw Meat, White Liver, bones…) often omit
 * `OTHER MATERIAL EFFECTS` on some monster sheets. Copy the shortest known
 * `otherEffect` for the same material name (or quantity-stripped base name)
 * onto empty-slot rows that lack one.
 */
export function backfillSharedOtherEffects(runes: Rune[]): Rune[] {
  const bestByKey = new Map<string, string>();
  for (const rune of runes) {
    const effect = rune.otherEffect?.trim();
    if (!effect) continue;
    preferShorterEffect(bestByKey, rune.name, effect);
    preferShorterEffect(bestByKey, stripMaterialQuantity(rune.name), effect);
  }

  return runes.map((rune) => {
    if (rune.otherEffect || rune.slots.length > 0) return rune;
    const filled =
      bestByKey.get(rune.name) ??
      bestByKey.get(stripMaterialQuantity(rune.name));
    return filled ? { ...rune, otherEffect: filled } : rune;
  });
}

/** Look up an effect by exact name, then by quantity-stripped base name. */
function lookupEffectByMaterialName(
  index: Record<string, string>,
  name: string,
): string | null {
  if (index[name]) return index[name];
  const base = stripMaterialQuantity(name);
  if (base !== name && index[base]) return index[base];
  for (const [key, value] of Object.entries(index)) {
    if (stripMaterialQuantity(key) === base) return value;
  }
  return null;
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

// mechanic:extra-damage, mechanic:healing, mechanic:spell y mechanic:spell-slot
// se emiten vía funciones de escala en lugar de patrones simples.
const ROLL_20_RE = /roll(?:s|ing)? a 20\b|natural 20/i;
const CRITICAL_WORD_RE = /\bcritic(?:al|ally)\b/i;
/** Offensive push — not Guard-style "cannot / can't be pushed". */
const PUSH_RE =
  /(?<!can(?:not|'t)\s)\b(?:is|are|be) pushed\b|\bpushed back(?:\s+(?:up to\s+)?\d+)?|\bpushed (?:up to )?\d+|\bpush(?:es)? the (?:target|creature)/i;
const YOUR_UNARMED_RE =
  /(?:make (?:an? |two |three )|your |with an |or )unarmed strikes?|proficien(?:t|cy) (?:in|with) unarmed strikes?/i;
/** Your / race natural weapons — not incoming "hits you with … a natural melee weapon". */
const YOUR_NATURAL_WEAPON_RE =
  /Race with natural weapons only|(?:your |race'?s )natural(?: melee)? weapons?|attack with (?:your |a |an |your race'?s )?natural(?: melee)? weapons?/i;
/** Includes MHMM average dice: "dealing 22 (4d10) fire damage" / "taking 4d6 …". */
const DAMAGE_AMOUNT =
  /(?:\d+\s*\(\s*)?(?:\{@damage\s+)?(?:\d+d\d+|\d+)(?:\})?(?:\s*\))?/;
const DAMAGE_OR_EXTRA_ATTACK_RE = new RegExp(
  String.raw`(?:takes?|taking|deals?|dealing)\s+(?:an?\s+)?(?:additional\s+)?${DAMAGE_AMOUNT.source}|loses?\s+(?:\d+d\d+|\d+)\s+hit points|damage dice one additional time|make one additional attack|(?:an? )?(?:additional|extra) attack`,
  "i",
);

const MECHANIC_PATTERNS: Array<[RegExp, string]> = [
  [/\d+\s*runes?|runes?\s*\d+/i, "mechanic:rune-charges"],
  [CRITICAL_WORD_RE, "mechanic:critical"],
  [ROLL_20_RE, "mechanic:roll-20"],
  [PUSH_RE, "mechanic:push"],
  // AoE shapes (cone / line / sphere / …) — Zorah Magdaros molten wave, breath weapons
  [
    /\b\d+[-\s]?foot[-\s]?(?:cone|line|radius|sphere|cube|cylinder)\b/i,
    "mechanic:area",
  ],
  [/resist(?:ant|ance) to\s+\w/i, "mechanic:resistance"],
  // `mechanic:immunity` — also via `immunityTag()` ("cannot be knocked prone", …)
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
    /saving throw/i,
    "mechanic:saving-throw",
  ],
  [
    /\+\d+\s*bonus\s+(?:on|to)\s+(?:strength|dexterity|constitution|intelligence|wisdom|charisma)\s+saving throws?/i,
    "mechanic:save-bonus",
  ],
  // "saving throw or be knocked prone, you do so with a +2 bonus"
  [
    /\bsaving throws?\b[\s\S]{0,80}do so with (?:a )?\+\d+\s*bonus/i,
    "mechanic:save-bonus",
  ],
  [/\+\d+\s*bonus\s+(?:on|to).*\{@skill/i, "mechanic:skill-bonus"],
  // Plain MHMM: "+2 bonus to Athletics checks" / "+2 bonus to Climb checks"
  [
    /\+\d+\s*bonus\s+(?:on|to)\s+[a-z][a-z\s-]{0,24}checks?\b/i,
    "mechanic:skill-bonus",
  ],
  [/\bdisarmed\b/i, "mechanic:disarm"],
  [/\bAC\b|armor class/i, "mechanic:armor-class"],
  // `mechanic:condition` is also added when conditionNameTags finds a named
  // condition (bare "poisoned condition" without {@condition} markup).
  [
    /\{@condition|(?:immune|immunity) to (?:the )?\w+ condition/i,
    "mechanic:condition",
  ],
  [/\bdiseases?\b/i, "mechanic:disease"],
  // movement / burrow / swim / fly / climb → `movementTags()`
  [/\bunderwater\b/i, "mechanic:underwater"],
  [/hold(?: your)? breath/i, "mechanic:hold-breath"],
  // light / darkness / darkvision → `lightDarknessTags()`
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

/**
 * Shortened long/short rest duration (Hypnocatrice-style trance), distinct from
 * recharge wording like "once per long rest" / "finish a long rest".
 */
function acceleratedRestTag(text: string): string | null {
  if (
    /benefits of a (?:long|short) rest after \d+\s*hours?/i.test(text) ||
    /(?:long|short) rest after \d+\s*hours? instead of/i.test(text) ||
    /only (?:need|require) \d+\s*hours? (?:for|to (?:complete|finish|take)) a (?:long|short) rest/i.test(
      text,
    ) ||
    /(?:complete|finish|take) a (?:long|short) rest in \d+\s*hours?/i.test(text)
  ) {
    return "mechanic:accelerated-rest";
  }
  return null;
}

/**
 * Weapon (or item) usable as a spellcasting focus — Ruby of the War Mage–style.
 * Distinct from `mechanic:focus-points` (Monk / similar class pools).
 */
function spellcastingFocusTag(text: string): string | null {
  if (
    /(?:as|as your|as a)\s+spellcasting focus/i.test(text) ||
    /use (?:this |the )?(?:weapon|item|armor|trinket) as (?:your |a )?spellcasting focus/i.test(
      text,
    )
  ) {
    return "mechanic:spellcasting-focus";
  }
  return null;
}

/**
 * Mithral Armor–style package: no Stealth disadvantage and/or no Strength
 * requirement, often with "light and flexible" / worn under clothes.
 * Partial "Str requirement reduced by N" alone is not this tag.
 */
function mithralArmorTag(text: string): string | null {
  const removesStealthDisadvantage =
    /imposes disadvantage on dexterity\s*\((?:\{@skill\s+)?stealth/i.test(
      text,
    ) && /(?:no longer does|doesn't|does not)/i.test(text);
  const removesStrengthRequirement =
    /strength requirement/i.test(text) &&
    /(?:no longer does|doesn't|does not)/i.test(text);
  const flexibleWording =
    /light and flexible|worn under normal clothes/i.test(text);

  if (
    (removesStealthDisadvantage && removesStrengthRequirement) ||
    (flexibleWording &&
      (removesStealthDisadvantage || removesStrengthRequirement))
  ) {
    return "mechanic:mithral";
  }
  return null;
}

/** Action economy that marks an effect as activated rather than always-on. */
const ACTION_ECONOMY_RE =
  /\bas an action\b|use (?:an |your )?action\b|bonus action|\breaction\b|spend (?:one|a|an|\d+) minutes?\b/i;

/**
 * Known condition names for wording without `{@condition}` (the X condition,
 * against being poisoned, afflicted with waterblight, …).
 * Longer / multi-word names first so "frenzy virus" wins over partials.
 */
const KNOWN_CONDITION_NAMES = [
  "frenzy virus",
  "waterblight",
  "iceblight",
  "thunderblight",
  "dragonblight",
  "bloodblight",
  "fireblight",
  "incapacitated",
  "unconscious",
  "frightened",
  "restrained",
  "paralyzed",
  "petrified",
  "exhaustion",
  "grappled",
  "invisible",
  "poisoned",
  "blinded",
  "deafened",
  "charmed",
  "stunned",
  "tarred",
  "stench",
  "prone",
  "slick",
  "frozen",
] as const;

/** Informal aliases that should emit the canonical `mechanic:condition-{n}` tag. */
const CONDITION_ALIASES: Record<string, string> = {
  paralysis: "paralyzed",
  stenched: "stench",
};

const CONDITION_TERM_TO_CANONICAL: Array<[string, string]> = [
  ...KNOWN_CONDITION_NAMES.map((name): [string, string] => [name, name]),
  ...Object.entries(CONDITION_ALIASES),
].sort((a, b) => b[0].length - a[0].length);

const CONDITION_TERM_ALT = CONDITION_TERM_TO_CANONICAL.map(([term]) =>
  term.replace(/\s+/g, "\\s+"),
).join("|");

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
 * From `{@skill Name}` and plain MHMM wording ("+2 bonus to Athletics checks",
 * "Climb checks" → athletics).
 */

/** Informal MHMM labels that map onto a 5e skill name. */
const SKILL_NAME_ALIASES: Record<string, string> = {
  climb: "athletics",
  climbing: "athletics",
};

const BARE_SKILL_NAMES = [
  ...Object.keys(SKILL_NAME_TO_KEY),
  ...Object.keys(SKILL_NAME_ALIASES),
].sort((a, b) => b.length - a.length);

function skillTags(text: string): string[] {
  const tags = new Set<string>();

  const addSkillName = (raw: string) => {
    const lower = raw.trim().toLowerCase();
    if (!lower) return;
    const canonical = SKILL_NAME_ALIASES[lower] ?? lower;
    if (!(canonical in SKILL_NAME_TO_KEY)) return;
    tags.add(`mechanic:skill-${canonical.replace(/\s+/g, "-")}`);
  };

  for (const match of text.matchAll(/\{@skill\s+([^}|]+)/gi)) {
    addSkillName(match[1] ?? "");
  }

  const lower = text.toLowerCase().replace(/\s+/g, " ");
  for (const name of BARE_SKILL_NAMES) {
    const escaped = name.replace(/\s+/g, "\\s+");
    // "Athletics checks", "Climb check", "+2 bonus to Stealth"
    // "Dexterity (Stealth) checks" / "(Stealth) checks"
    const asChecks = new RegExp(`\\b${escaped}\\s+checks?\\b`, "i");
    const asParenChecks = new RegExp(
      `\\(${escaped}\\)\\s*checks?\\b`,
      "i",
    );
    const afterBonus = new RegExp(
      `\\+\\d+\\s*bonus\\s+(?:on|to)\\s+${escaped}\\b`,
      "i",
    );
    const afterAdvantage = new RegExp(
      `\\badvantage\\b[^.]{0,48}\\b${escaped}\\s+checks?\\b`,
      "i",
    );
    if (
      asChecks.test(lower) ||
      asParenChecks.test(lower) ||
      afterBonus.test(lower) ||
      afterAdvantage.test(lower)
    ) {
      addSkillName(name);
    }
  }

  return Array.from(tags);
}

const ABILITY_NAMES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

/**
 * mechanic:save-dexterity, etc. when *your* named ability save is buffed.
 * Also emits mechanic:attack-roll for attack-roll grants / advantage.
 */
function rollTargetTags(text: string): string[] {
  const tags: string[] = [];

  for (const ability of ABILITY_NAMES) {
    // Buffs to your saves — not "target must make a Dexterity saving throw".
    if (
      new RegExp(
        `\\+\\d+\\s+bonus\\s+(?:on|to)\\s+${ability}\\s+saving throws?`,
        "i",
      ).test(text) ||
      new RegExp(
        `advantage on(?:\\s+\\w+){0,8}\\s+${ability}\\s+saving throws?`,
        "i",
      ).test(text)
    ) {
      tags.push(`mechanic:save-${ability}`);
    }
  }

  if (
    /\battack rolls?\b/i.test(text) ||
    /\bon the attack roll\b/i.test(text)
  ) {
    tags.push("mechanic:attack-roll");
  }

  return tags;
}

/**
 * mechanic:initiative — buffs initiative rolls or order (not FastCharge
 * "when you roll for initiative, gain charges").
 * mechanic:initiative:major — flat die bonus (d8+) and/or force first.
 */
function initiativeTags(text: string): string[] {
  const tags: string[] = [];

  const hasAdvantage =
    /advantage on initiative(?:\s+rolls?)?\b/i.test(text) ||
    /initiative(?:\s+rolls?)?\b[^.]{0,40}\badvantage\b/i.test(text) ||
    (/roll for initiative/i.test(text) &&
      /\bgain advantage\b|\badvantage on that roll\b/i.test(text));

  const hasDieBonus =
    /add a d(\d+)\s+to your initiative\b/i.test(text) ||
    /\+\s*\d+\s*(?:bonus\s+)?to (?:your )?initiative\b/i.test(text);

  const forcesFirst =
    /(?:become|are) first in the initiative\b/i.test(text) ||
    /first in the initiative order\b/i.test(text);

  if (!hasAdvantage && !hasDieBonus && !forcesFirst) return [];

  tags.push("mechanic:initiative");

  const dieMatch = text.match(/add a d(\d+)\s+to your initiative\b/i);
  const dieFaces = dieMatch ? parseInt(dieMatch[1] ?? "0", 10) : 0;
  if (forcesFirst || dieFaces >= 8) {
    tags.push("mechanic:initiative:major");
  }

  return tags;
}

/**
 * mechanic:heal-other:minor / :major — improves healing you provide to others
 * (spell heal riders, Lay on Hands THP, HP-transfer heals). Not self-only
 * Recovery Up / Hasten Recovery.
 */
function healOtherTag(text: string): string | null {
  // Spell restore to a creature + additional HP (Astalos Scissortail / +)
  if (
    /restore hit points to a creature/i.test(text) &&
    /additional hit points/i.test(text)
  ) {
    if (
      /double the spell(?:'s|’s)? level/i.test(text) ||
      /twice the spell(?:'s|’s)? level/i.test(text) ||
      /additional hit points equal to double/i.test(text)
    ) {
      return "mechanic:heal-other:major";
    }
    return "mechanic:heal-other:minor";
  }

  // Lay on Hands outgoing restore + THP rider
  if (/Lay on Hands/i.test(text) && /restore a creature'?s? hit points/i.test(text)) {
    if (/you and the creature gain temporary hit points/i.test(text)) {
      return "mechanic:heal-other:major";
    }
    if (/gains? temporary hit points equal to the amount healed/i.test(text)) {
      return "mechanic:heal-other:minor";
    }
  }

  // Direct transfer heal to another creature (Malzeno Tail)
  if (/heal another creature/i.test(text)) {
    return "mechanic:heal-other:major";
  }

  // Generic "when you heal a creature" with a meaningful rider (Benediction DR)
  // — still an outgoing-heal package, minor unless the text scales hard.
  if (
    /when you heal a creature\b/i.test(text) &&
    /hit points you healed/i.test(text)
  ) {
    return "mechanic:heal-other:minor";
  }

  return null;
}

/**
 * mechanic:condition-stunned, mechanic:condition-poisoned, etc.
 * From `{@condition Name}`, "immune to the ___ condition", and known
 * names used bare ("against being poisoned", "afflicted with waterblight").
 */
function conditionNameTags(text: string): string[] {
  const tags = new Set<string>();

  const add = (raw: string) => {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    const canonical = CONDITION_ALIASES[name] ?? name;
    tags.add(`mechanic:condition-${canonical.replace(/\s+/g, "-")}`);
  };

  for (const match of text.matchAll(/\{@condition\s+([^}|]+)/gi)) {
    add(match[1] ?? "");
  }
  for (const match of text.matchAll(
    /(?:immune|immunity) to (?:the )?([a-z][a-z\s-]{0,40}?) condition/gi,
  )) {
    add(match[1] ?? "");
  }
  for (const [term, canonical] of CONDITION_TERM_TO_CANONICAL) {
    const escaped = term.replace(/\s+/g, "\\s+");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) {
      add(canonical);
    }
  }

  return Array.from(tags);
}

/**
 * mechanic:item-related — effect references a usable item (`{@item …}`).
 * mechanic:trap — MH trap subset (pitfall / shock / trap tool). Always also item-related.
 */
const MH_TRAP_ITEM =
  /\{@item\s+(?:pitfall trap\+?|shock trap\+?|trap tool)\b/i;
const MH_TRAP_BARE = /\b(?:pitfall trap\+?|shock trap\+?|trap tool)\b/i;

function itemRelatedTags(text: string): string[] {
  const tags: string[] = [];
  const hasTrap = MH_TRAP_ITEM.test(text) || MH_TRAP_BARE.test(text);
  if (/\{@item\b/i.test(text) || hasTrap) tags.push("mechanic:item-related");
  if (hasTrap) tags.push("mechanic:trap");
  return tags;
}

/** Named class pools (ki, Channel Divinity, …) → specific tag + `class-resource`. */
const CLASS_RESOURCE_KIND_PATTERNS: Array<[RegExp, string]> = [
  [/\bki points?\b/i, "mechanic:ki"],
  [/\bsorcery points?\b/i, "mechanic:sorcery-points"],
  [/\bchannel divinity\b/i, "mechanic:channel-divinity"],
  [/\bsuperiority dice\b/i, "mechanic:superiority-dice"],
  [/\bbardic inspiration\b/i, "mechanic:bardic-inspiration"],
  [/\bfocus points?\b/i, "mechanic:focus-points"],
];

const CLASS_RESOURCE_RECOVERY_RE =
  /(?:regain|restore|recover)\s+(?:a number of |(?:one|an?|\d+)\s+)?(?:expended\s+)?(?:ki points?|sorcery points?|superiority dice|bardic inspiration|focus points?|channel divinity)|(?:regain|restore|recover).{0,48}(?:expended\s+)?(?:ki points?|sorcery points?|superiority dice|bardic inspiration|focus points?)/i;

/**
 * Class-feature resource pools (not spell slots / rune charges).
 * Emits the specific pool tag + `mechanic:class-resource`, and
 * `mechanic:recover-class-resource` when the effect restores expended uses.
 */
function classResourceTags(text: string): string[] {
  const tags: string[] = [];
  for (const [pattern, tag] of CLASS_RESOURCE_KIND_PATTERNS) {
    if (pattern.test(text)) tags.push(tag);
  }
  if (tags.length === 0) return [];

  tags.push("mechanic:class-resource");
  if (CLASS_RESOURCE_RECOVERY_RE.test(text)) {
    tags.push("mechanic:recover-class-resource");
  }
  return tags;
}

/**
 * MH field-gathering utility (Botanist / Geologist / Fisherman / Pack Rat, …).
 * Always emits `mechanic:gather-resources` when any subtype or general gather
 * wording matches; stronger yields (1d4 / party double / free gather) also get
 * `mechanic:gather-resources:major`.
 */
function gatherResourceTags(text: string): string[] {
  const tags: string[] = [];

  if (/\bcatch fish\b|fishing pole|sushifish/i.test(text)) {
    tags.push("mechanic:fishing");
  }
  if (
    /mining resource|\bmine or gather\b|mineral resource|Mineralogist|Crystallography/i.test(
      text,
    )
  ) {
    tags.push("mechanic:mining");
  }
  if (
    /plant resource|herbalist kit to gather plants|\bHoney Hunter\b/i.test(text)
  ) {
    tags.push("mechanic:plant");
  }
  if (/bone resource/i.test(text)) {
    tags.push("mechanic:bone");
  }
  if (/harvest mushrooms/i.test(text)) {
    tags.push("mechanic:foraging");
  }
  if (
    /insect with a bug net|insects? resources?|\bEntomologist\b/i.test(text)
  ) {
    tags.push("mechanic:insects");
  }

  const isGeneralGather =
    /gather(?:s|ing)? (?:a |an |the )?(?:\w+ )?resources?|\bPack Rat\b|\bHoarding\b|Speed Gatherer|Hunter Gatherer|resource table|\b(?:Divine |Spirit'?s )?Whim\b/i.test(
      text,
    );

  if (tags.length === 0 && !isGeneralGather) return [];

  tags.push("mechanic:gather-resources");

  if (
    /extra 1d4|instead (?:gather|catch) 1d4|gather 1d4|catch an? extra 1d4|an extra 1d4 more|1d4 additional resources|double the (?:normal )?number|gather double|doesn't count against the maximum|gain double the amount/i.test(
      text,
    )
  ) {
    tags.push("mechanic:gather-resources:major");
  }

  return tags;
}

/**
 * Illumination and darkness-related utility.
 * - `mechanic:light` — produces bright/dim light (or moonlight that creates it)
 * - `mechanic:darkness` — mentions darkness (environment, creation, or sight)
 * - `mechanic:nonmagical-darkness` — natural / nonmagical darkness (or bare
 *   "in darkness" / "dim light or darkness" without a magical clause)
 * - `mechanic:magical-darkness` — magical darkness, or "both magical and nonmagical"
 * - `mechanic:darkvision` — grants darkvision (not "see normally in darkness")
 */
function lightDarknessTags(text: string): string[] {
  const tags: string[] = [];

  // Produce light — not bare "in dim light or darkness" environment wording.
  const producesLight =
    /\bsheds?\s+moonlight\b/i.test(text) ||
    /\blight the weapon\b/i.test(text) ||
    /(?:sheds?|creating|providing|casts?)\s+(?:bright\s+)?(?:[\w-]+-colored\s+)?light\b/i.test(
      text,
    ) ||
    /\bsheds?\s+dim light\b/i.test(text) ||
    /\bbright (?:[\w-]+-colored\s+)?light in (?:a )?(?:\d|[\d-])/i.test(text) ||
    /\bdim light for an additional\b/i.test(text);
  if (producesLight) tags.push("mechanic:light");

  const hasDarkness = /\bdarkness\b/i.test(text);
  if (hasDarkness) tags.push("mechanic:darkness");

  const hasMagicalDarkness =
    /\bmagical(?:\s+and\s+nonmagical)?\s+darkness\b/i.test(text) ||
    /darkness,?\s+both magical and nonmagical/i.test(text) ||
    /see normally in darkness,?\s+both magical/i.test(text);
  if (hasMagicalDarkness) tags.push("mechanic:magical-darkness");

  const hasExplicitNonmagicalDarkness =
    /\bnonmagical darkness\b/i.test(text) ||
    /darkness,?\s+both magical and nonmagical/i.test(text) ||
    /see normally in darkness,?\s+both magical and nonmagical/i.test(text);
  // Bare "in darkness" / "dim light or darkness" is natural darkness unless the
  // text is specifically about magical darkness only.
  const hasImpliedNaturalDarkness =
    hasDarkness &&
    !hasMagicalDarkness &&
    (/\bin darkness\b/i.test(text) ||
      /\bdim light or darkness\b/i.test(text) ||
      /into darkness\b/i.test(text));
  if (hasExplicitNonmagicalDarkness || hasImpliedNaturalDarkness) {
    tags.push("mechanic:nonmagical-darkness");
  }

  if (/\bdarkvision\b/i.test(text)) tags.push("mechanic:darkvision");

  return tags;
}

/**
 * Speed / movement grants and speed debuffs.
 * Umbrella `mechanic:movement` plus mode tags (burrowing, swimming, flying,
 * climbing, walking-speed, icy-surfaces, movement-climb, ignore-difficult-terrain).
 * Stronger walk bumps / fly 60+ also get `movement:major`.
 */
function movementTags(text: string): string[] {
  const tags: string[] = [];

  if (/\bburrowing speed\b/i.test(text)) tags.push("mechanic:burrowing");
  if (/\bswimming speed\b/i.test(text)) tags.push("mechanic:swimming");
  if (/\bflying speed\b/i.test(text)) tags.push("mechanic:flying");
  if (/\bclimbing speed\b/i.test(text) || /\bSpider Climb\b/i.test(text)) {
    tags.push("mechanic:climbing");
  }
  if (
    /walking speed (?:increases|becomes|doubles)|your (?:movement )?speed increases/i.test(
      text,
    )
  ) {
    tags.push("mechanic:walking-speed");
  }

  const hasIcySurfaces =
    /\bicy surfaces?\b/i.test(text) ||
    /difficult terrain (?:composed of |created by )(?:ice|snow)/i.test(text) ||
    /(?:ice or snow|snow or ice)\b/i.test(text);
  if (hasIcySurfaces) tags.push("mechanic:icy-surfaces");

  if (
    /\bclimb(?:s|ing)?\b.{0,40}\bicy\b|\bclimb(?:s|ing)? icy\b/i.test(text) ||
    (/move across and climb/i.test(text) && hasIcySurfaces)
  ) {
    tags.push("mechanic:movement-climb");
  }

  if (/\bdifficult terrain\b/i.test(text)) {
    tags.push("mechanic:difficult-terrain");
  }
  if (
    /ignore(?:s|d)? difficult terrain/i.test(text) ||
    /difficult terrain.{0,60}doesn'?t cost .{0,20}extra (?:movement|moment)/i.test(
      text,
    )
  ) {
    tags.push("mechanic:ignore-difficult-terrain");
  }

  const hasGeneralMovement =
    /(?:movement|speed|jump)\s+(?:increase[sd]?|by|of|\d+)/i.test(text) ||
    /speed (?:is |are )?(?:reduced|doubled|increased)/i.test(text) ||
    /\bspeed of \d+/i.test(text) ||
    /movement speed/i.test(text) ||
    hasIcySurfaces ||
    tags.includes("mechanic:ignore-difficult-terrain") ||
    tags.includes("mechanic:movement-climb");

  if (tags.length === 0 && !hasGeneralMovement) return [];

  tags.push("mechanic:movement");

  if (
    /walking speed increases by (?:1[0-9]|[2-9]\d)|walking speed doubles|your (?:movement )?speed increases by (?:1[0-9]|[2-9]\d)/i.test(
      text,
    ) ||
    (/flying speed of (?:[6-9]\d|\d{3,})/i.test(text) &&
      tags.includes("mechanic:flying"))
  ) {
    tags.push("mechanic:movement:major");
  }

  return tags;
}

/**
 * Weapon attack distance — not Critical Eye ("critical hit range").
 * `mechanic:attack-range` for +N ft; `:major` when the normal range is doubled.
 * `mechanic:reach` for melee reach extensions.
 */
function weaponDistanceTags(text: string): string[] {
  const tags: string[] = [];

  const attackRangeChange =
    /(?:normal )?attack range is (?:increased|doubled)/i.test(text) ||
    /weapon'?s normal (?:attack )?range is (?:increased|doubled)/i.test(text);

  if (attackRangeChange) {
    tags.push("mechanic:attack-range");
    if (
      /(?:normal )?(?:attack )?range is doubled/i.test(text) ||
      /attack range is doubled/i.test(text)
    ) {
      tags.push("mechanic:attack-range:major");
    }
  }

  if (
    /(?:weapon'?s |its )?reach is increased/i.test(text) ||
    /extend(?:s|ing)? (?:its |the weapon'?s )?reach by/i.test(text)
  ) {
    tags.push("mechanic:reach");
  }

  return tags;
}

/**
 * Full condition lockouts phrased without "immune to":
 * "cannot be knocked prone", "can't be stunned", "cannot be poisoned,
 * paralyzed, or stunned". Excludes "can't be afflicted…" (against-condition)
 * and utility wording ("cannot be used / pushed / detected / …").
 */
function conditionImmunityCannotBeTag(text: string): string | null {
  const clauseRe =
    /can(?:not|'t)\s+be\s+(?!afflicted\b)((?:unwillingly\s+)?.{0,120}?)(?=[.;]|$)/gi;
  for (const match of text.matchAll(clauseRe)) {
    const clause = match[1] ?? "";
    if (
      new RegExp(`(?:knocked\\s+)?(?:${CONDITION_TERM_ALT})\\b`, "i").test(
        clause,
      )
    ) {
      return "mechanic:immunity";
    }
  }
  return null;
}

/**
 * mechanic:against-condition — helps avoid acquiring a condition (advantage /
 * save bonus vs being X, can't be afflicted, …). Not full condition immunity —
 * that is `mechanic:immunity` + `mechanic:condition-*` only.
 */
function againstConditionTag(text: string): string | null {
  if (/can'?t be afflicted (?:with|to)/i.test(text)) {
    return "mechanic:against-condition";
  }

  // "against being stunned", "against the poisoned condition", "against paralysis"
  if (
    new RegExp(
      `saving throws? against (?:being\\b|(?:the )?(?:${CONDITION_TERM_ALT})(?:\\s+condition)?\\b|\\{@condition)`,
      "i",
    ).test(text)
  ) {
    return "mechanic:against-condition";
  }

  // "saving throw or be knocked prone, you do so with advantage / a +2 bonus"
  // (with or without {@condition} markup). Requires a save buff so offensive
  // "or be stunned" riders are not tagged.
  const saveOrBecomeCondition =
    /(?:or be (?:knocked )?|or become )/i.test(text) &&
    (new RegExp(`\\b(?:${CONDITION_TERM_ALT})\\b`, "i").test(text) ||
      /\{@condition/i.test(text));
  const saveBuff =
    /\badvantage\b/i.test(text) ||
    /do so with (?:a )?\+\d+\s*bonus/i.test(text);
  if (saveOrBecomeCondition && saveBuff) {
    return "mechanic:against-condition";
  }

  return null;
}

/**
 * mechanic:active  — spends action / BA / reaction (or is otherwise activated).
 * mechanic:passive — always-on while worn/attuned (or continuous grant wording).
 * Active wins when both would apply (e.g. "while wearing, as a bonus action…").
 */
function passiveActiveTags(text: string, tags: Set<string>): string[] {
  const isActive =
    tags.has("mechanic:bonus-action") ||
    tags.has("mechanic:reaction") ||
    ACTION_ECONOMY_RE.test(text);

  if (isActive) return ["mechanic:active"];

  if (tags.has("mechanic:end-dot")) return ["mechanic:passive"];

  const isPassive =
    /while you (?:wear|are wearing|are attuned|hold)|while (?:wearing|attuned|holding|you wear)/i.test(
      text,
    ) ||
    /whenever you (?:make|must succeed on) a saving throw/i.test(text) ||
    /\byou (?:have|are|gain)\b/i.test(text) ||
    /(?:normal )?attack range is (?:increased|doubled)/i.test(text) ||
    /reach is increased by/i.test(text) ||
    // Always-on armor property transforms (Mithral-style / lighter armor)
    /your armor becomes|this armor is \d+%\s*lighter|can be worn under normal clothes/i.test(
      text,
    );

  if (isPassive) return ["mechanic:passive"];
  return [];
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

const SPELL_SLOT_RECOVERY =
  /(?:regain|restore|recover)\s+(?:one |a |an |\d+ )?(?:expended )?spell slots?/i;
const ORDINAL_SPELL_LEVEL = /\b(\d+)(?:st|nd|rd|th)[-\s]?level\b/gi;

function parseHighestOrdinalSpellLevel(text: string): number | null {
  let max: number | null = null;
  for (const match of text.matchAll(
    new RegExp(ORDINAL_SPELL_LEVEL.source, "gi"),
  )) {
    const n = parseInt(match[1] ?? "", 10);
    if (n < 1 || n > 9) continue;
    max = Math.max(max ?? 0, n);
  }
  return max;
}

/**
 * Pearl of Power–style slot recovery, not casting and not "without expending a slot".
 * mechanic:spell-slot:lvlN when the text names a max slot level; otherwise mechanic:spell-slot.
 */
function spellSlotRecoveryTags(text: string): string[] {
  if (!SPELL_SLOT_RECOVERY.test(text)) return [];
  const level = parseHighestOrdinalSpellLevel(text);
  if (level != null) return [`mechanic:spell-slot:lvl${level}`];
  return ["mechanic:spell-slot"];
}

/**
 * mechanic:spell-buff:damage → bonus/advantage a spell attack rolls o daño de hechizos
 * mechanic:spell-buff:save   → bonus/incremento al spell save DC
 *
 * Requires personal buff language tied to spell attack / save DC — not rune-bank
 * wording like "cast … using your spell save DC" / "regain 1d6 + 4 runes".
 */
function spellBuffTags(text: string): string[] {
  const tags: string[] = [];

  const hasNumericSpellBuff =
    /\+\s*\d+\s*(?:bonus\s+)?to\s+(?:(?:your|its)\s+)?(?:[\w\s,]{0,40})?spell(?:\s+attack|\s+save)/i.test(
      text,
    ) ||
    /gain \+\s*\d+ to spell attack/i.test(text) ||
    /(?:spell attack(?:\s+rolls?|\s+bonus)?|spell save\s*DC).{0,48}(?:increase|\+\s*\d+)/i.test(
      text,
    ) ||
    /increase(?:s|d)?(?:\s+\w+){0,10}\s+(?:the\s+|your\s+|its\s+)?spell(?:\s+attack|\s+save)/i.test(
      text,
    );

  const hasAdvantageSpellAttack =
    /\badvantage\b/i.test(text) && /spell attack/i.test(text);

  if (!hasNumericSpellBuff && !hasAdvantageSpellAttack) return tags;

  const targetsSaveDc = /spell save\s*DC/i.test(text);
  const targetsDamageOrAttack =
    /spell attack(?:\s+rolls?|\s+bonus)?|\bspell attacks?\b|spell damage/i.test(
      text,
    );

  if (targetsSaveDc) tags.push("mechanic:spell-buff:save");
  if (targetsDamageOrAttack) tags.push("mechanic:spell-buff:damage");

  return tags;
}

function textGrantsSpellLanguage(text: string): boolean {
  const hasSpellOrCantrip = /\bspell\b/i.test(text) || /\bcantrip\b/i.test(text);
  if (!hasSpellOrCantrip) return false;
  return (
    /\bcast(?:s|ing)?\b/i.test(text) || /\bknow(?:s|ing)?\b/i.test(text)
  );
}

/**
 * Resolves spell tags from the spell catalog when possible.
 * Matches `{@spell …}` and plain MHMM wording ("cast the Earth Tremor spell",
 * "know the ice knife spell").
 * Fallback heuristic when the spell is unknown / lookup missing:
 * - mechanic:spell:lvl3+ for 3rd+ language or costly runes
 * - mechanic:spell:lvl1-2 otherwise (except cantrip-only `{@spell}` text)
 */
function spellTags(
  text: string,
  spellLevels?: SpellLevelLookup | null,
): string[] {
  const hasMarkup = /\{@spell/i.test(text);
  if (!hasMarkup && !textGrantsSpellLanguage(text)) return [];

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
    // Markup cantrip with no catalog hit: keep prior behavior (cantrip word pattern).
    // Plain "cast/know the mold earth cantrip" still needs an explicit cantrip tag.
    return hasMarkup ? [] : ["mechanic:cantrip"];
  }

  return ["mechanic:spell:lvl1-2"];
}

function tagsGrantSpell(tags: Set<string>): boolean {
  return (
    tags.has("mechanic:cantrip") ||
    [...tags].some(
      (tag) =>
        tag === "mechanic:spell:lvl1-2" ||
        tag === "mechanic:spell:lvl3+" ||
        /^mechanic:spell:lvl\d+$/.test(tag),
    )
  );
}

/**
 * mechanic:spell:one-use — rune grants a single cast per recharge (once/day,
 * once per rest, "once used…"), not at-will and not a multi-use rune bank.
 */
function oneUseSpellTag(text: string, tags: Set<string>): string | null {
  if (!tagsGrantSpell(tags)) return null;

  if (/\bat will\b/i.test(text)) return null;
  if (/\bruness?\b/i.test(text) && /expend/i.test(text)) return null;
  if (
    /\b(?:twice|thrice|two|three|[2-9]|1\d)\s+times?\b/i.test(text) &&
    /(?:rest|dawn|day|uses?)/i.test(text)
  ) {
    return null;
  }

  const once =
    /\bonce per (?:short or )?long rest\b/i.test(text) ||
    /\bonce per (?:short )?rest\b/i.test(text) ||
    /\bonce (?:per|a) day\b/i.test(text) ||
    /\bonce used\b/i.test(text) ||
    /can'?t use (?:it |this property )?again/i.test(text) ||
    /can'?t be used again/i.test(text);

  return once ? "mechanic:spell:one-use" : null;
}

/**
 * mechanic:spell:prepared — always prepared / free prepare slot while the
 * material is worn or attuned (Beotodus Fin, Steel Uragaan, …).
 */
function preparedSpellTag(text: string, tags: Set<string>): string | null {
  if (!tagsGrantSpell(tags)) return null;

  const alwaysPrepared =
    /always have (?:it |them |this spell )?prepared/i.test(text) ||
    /(?:have to )?prepare spells[^.]*always have/i.test(text);
  const freePrepareSlot =
    /doesn'?t count against the number of spells you can prepare/i.test(text);

  return alwaysPrepared || freePrepareSlot
    ? "mechanic:spell:prepared"
    : null;
}

/**
 * mechanic:end-dot — ends ongoing damage-over-time on you at the start of your
 * turn (Recovery Level: bleeding, acid/poison DoT, on fire, …).
 */
function endDotTag(text: string): string | null {
  const cleansesAtTurnStart =
    /damage to you at the start of your turn/i.test(text) &&
    /ends the effect/i.test(text);
  const describesDotCleanse =
    /continues to damage you over time/i.test(text) &&
    /ends the effect/i.test(text);
  return cleansesAtTurnStart || describesDotCleanse
    ? "mechanic:end-dot"
    : null;
}

/**
 * type:offensive  → más daño (extra damage, named criticals, buffs de ataque/daño)
 * type:defensive  → menos daño recibido o bonus de AC
 * type:support    → ayuda a aliados o menciona criaturas willing
 *
 * Rolling a 20 alone is not offensive: a 5-foot push with no damage stays untyped.
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
  } else if (healOtherTag(text) != null) {
    tags.push("type:support");
  }

  const isDefensive =
    /\bAC\b|armor class/i.test(text) ||
    /resist(?:ant|ance) to\s+\w/i.test(text) ||
    /immune to|immunity to/i.test(text) ||
    conditionImmunityCannotBeTag(text) != null ||
    endDotTag(text) != null ||
    /(?:reduce|reduces) (?:the |that |any )?damage(?: you take)? (?:by|to)/i.test(
      text,
    ) ||
    /damage (?:you take )?is reduced (?:by|to)/i.test(text) ||
    /when you (?:take|would take)(?: \w+)* damage[^.]*reduce/i.test(text) ||
    /Guard AC/i.test(text) ||
    /\+\d+\s*bonus\s+(?:on|to)\s+\w+\s+saving throws?/i.test(text) ||
    (/saving throw/i.test(text) &&
      /\badvantage\b/i.test(text) &&
      !/\bdisadvantage\b/i.test(text)) ||
    (/saving throw/i.test(text) &&
      /do so with (?:a )?\+\d+\s*bonus/i.test(text)) ||
    (/\badvantage\b/i.test(text) && /against being disarmed/i.test(text));

  if (isDefensive) tags.push("type:defensive");

  const isOffensive =
    /extra (?:\{@damage|\d+d\d+)/i.test(text) ||
    CRITICAL_WORD_RE.test(text) ||
    /\+\d+\s*bonus.*(?:attack|damage)/i.test(text) ||
    /(?:attack|damage) roll.*\+\d+/i.test(text) ||
    /spell attack\s+roll|spell damage|damage roll/i.test(text) ||
    (/\{@condition/i.test(text) && /(?:hit|attack|strike|on a hit)/i.test(text)) ||
    new RegExp(
      String.raw`(?:deals?|dealing|extra|takes?|taking)\s+(?:an?\s+)?(?:additional\s+)?${DAMAGE_AMOUNT.source}`,
      "i",
    ).test(text) ||
    (/\{@spell/i.test(text) && /deals?\s+\w+\s+damage/i.test(text)) ||
    (/\badvantage\b/i.test(text) &&
      /\b(?:the )?attack rolls?\b/i.test(text) &&
      !/\bdisadvantage\b/i.test(text));

  if (isOffensive) tags.push("type:offensive");

  return tags;
}

/** Your unarmed strikes — not incoming "hits you with an unarmed strike". */
function unarmedStrikeTag(text: string): string | null {
  return YOUR_UNARMED_RE.test(text) ? "mechanic:unarmed" : null;
}

/** Your / race natural weapons — not armor thorns listing "natural melee weapon". */
function naturalWeaponTag(text: string): string | null {
  return YOUR_NATURAL_WEAPON_RE.test(text) ? "mechanic:natural-weapon" : null;
}

/**
 * Nat-20 riders whose payoff is not extra damage or a bonus attack.
 * Lets Tetranadon Beak-style pushes filter separately from crit DoT.
 */
function noDamageRiderTag(text: string, tags: Set<string>): string | null {
  if (!tags.has("mechanic:roll-20")) return null;
  if ([...tags].some((tag) => tag.startsWith("mechanic:extra-damage"))) {
    return null;
  }
  if (DAMAGE_OR_EXTRA_ATTACK_RE.test(text)) return null;
  return "mechanic:no-damage";
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

  const acceleratedRest = acceleratedRestTag(effectText);
  if (acceleratedRest) tags.add(acceleratedRest);

  const spellcastingFocus = spellcastingFocusTag(effectText);
  if (spellcastingFocus) tags.add(spellcastingFocus);

  const mithral = mithralArmorTag(effectText);
  if (mithral) tags.add(mithral);

  // Sub-tags escalados (reemplazan los genéricos)
  const dmg = extraDamageTag(effectText);
  if (dmg) tags.add(dmg);

  const heal = healingTag(effectText);
  if (heal) tags.add(heal);

  const healOther = healOtherTag(effectText);
  if (healOther) tags.add(healOther);

  for (const spell of spellTags(effectText, spellLevels)) {
    tags.add(spell);
  }

  const oneUseSpell = oneUseSpellTag(effectText, tags);
  if (oneUseSpell) tags.add(oneUseSpell);

  const preparedSpell = preparedSpellTag(effectText, tags);
  if (preparedSpell) tags.add(preparedSpell);

  for (const slotTag of spellSlotRecoveryTags(effectText)) {
    tags.add(slotTag);
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

  for (const rollTag of rollTargetTags(effectText)) {
    tags.add(rollTag);
  }

  for (const initiativeTag of initiativeTags(effectText)) {
    tags.add(initiativeTag);
  }

  for (const conditionTag of conditionNameTags(effectText)) {
    tags.add(conditionTag);
  }
  if ([...tags].some((tag) => tag.startsWith("mechanic:condition-"))) {
    tags.add("mechanic:condition");
  }

  const cannotBeImmunity = conditionImmunityCannotBeTag(effectText);
  if (cannotBeImmunity) tags.add(cannotBeImmunity);

  const againstCondition = againstConditionTag(effectText);
  if (againstCondition) tags.add(againstCondition);

  const endDot = endDotTag(effectText);
  if (endDot) tags.add(endDot);

  for (const itemTag of itemRelatedTags(effectText)) {
    tags.add(itemTag);
  }

  for (const classResourceTag of classResourceTags(effectText)) {
    tags.add(classResourceTag);
  }

  for (const gatherTag of gatherResourceTags(effectText)) {
    tags.add(gatherTag);
  }

  for (const lightTag of lightDarknessTags(effectText)) {
    tags.add(lightTag);
  }

  for (const moveTag of movementTags(effectText)) {
    tags.add(moveTag);
  }

  for (const distanceTag of weaponDistanceTags(effectText)) {
    tags.add(distanceTag);
  }

  const unarmed = unarmedStrikeTag(effectText);
  if (unarmed) tags.add(unarmed);

  const naturalWeapon = naturalWeaponTag(effectText);
  if (naturalWeapon) tags.add(naturalWeapon);

  const noDamage = noDamageRiderTag(effectText, tags);
  if (noDamage) tags.add(noDamage);

  for (const activationTag of passiveActiveTags(effectText, tags)) {
    tags.add(activationTag);
  }

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

/**
 * Returns true when an inset's sub-entries contain a carve-chance loot table.
 * Used to pick the right inset for monsters that have both a DM-Note inset
 * (e.g. Gypceros "Feign Death") and the actual loot-table inset.
 */
function insetHasLootTable(insetEntries: unknown[]): boolean {
  return insetEntries.some((e) => {
    if (typeof e !== "object" || e === null) return false;
    const obj = e as Raw;
    return (
      obj.type === "table" &&
      Array.isArray(obj.colLabels) &&
      String(obj.colLabels[0]).toLowerCase().includes("carve")
    );
  });
}

/**
 * Finds the loot-table inset (the one whose sub-entries contain a
 * "Carve Chance" table) rather than blindly returning the first inset.
 * Falls back to the first inset found if none contains a loot table.
 */
function findInset(entries: unknown[]): Raw | undefined {
  const insets: Raw[] = [];

  for (const e of entries) {
    if (typeof e !== "object" || e === null) continue;
    const obj = e as Raw;
    if (obj.type === "inset") {
      insets.push(obj);
    } else if (Array.isArray(obj.entries)) {
      const found = findInset(obj.entries as unknown[]);
      if (found) return found;
    }
  }

  // Prefer the inset that contains the loot table; fall back to first.
  return (
    insets.find(
      (inset) =>
        Array.isArray(inset.entries) &&
        insetHasLootTable(inset.entries as unknown[]),
    ) ?? insets[0]
  );
}

export function mapRunesFromMonster(
  rawMonster: unknown,
  spellLevels?: SpellLevelLookup | null,
): Rune[] {
  if (typeof rawMonster !== "object" || rawMonster === null) return [];
  const monster = rawMonster as Raw;
  const fluff = monster?.fluff;
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
  const otherList = lists.find((l) => l.name === "OTHER MATERIAL EFFECTS");

  const armorEffects = indexEffectsByName(armorList?.items ?? []);
  const weaponEffects = indexEffectsByName(weaponList?.items ?? []);
  const otherEffects = indexEffectsByName(otherList?.items ?? []);

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
      carveChance = normalizeLootChance(String(row[0] ?? "-"));
      captureChance = normalizeLootChance(String(row[1] ?? "-"));
      name = String(row[2] ?? "");
      slotsStr = String(row[3] ?? "");
    } else {
      carveChance = normalizeLootChance(String(row[0] ?? "-"));
      captureChance = "-";
      name = String(row[1] ?? "");
      slotsStr = String(row[2] ?? "");
    }

    if (!name) continue;

    const slots = parseSlots(slotsStr);
    const armorEffect = lookupEffectByMaterialName(armorEffects, name);
    const weaponEffect = lookupEffectByMaterialName(weaponEffects, name);
    const otherEffect = lookupEffectByMaterialName(otherEffects, name);

    const weaponTags = weaponEffect
      ? extractTags(weaponEffect, spellLevels)
      : [];
    const armorTags = armorEffect
      ? extractTags(armorEffect, spellLevels)
      : [];
    const tags = Array.from(new Set([...weaponTags, ...armorTags]));

    runes.push({
      name,
      monsterName: String(monster.name ?? ""),
      monsterSource: String(monster.source ?? ""),
      monsterCr: formatCrDisplay(monster.cr),
      monsterCrs: getCrValues(monster.cr),
      tier: crToTier(monster.cr),
      carveChance,
      captureChance,
      rolls,
      slots,
      armorEffect,
      weaponEffect,
      otherEffect,
      tags,
      weaponTags,
      armorTags,
    });
  }
  // console.log(runes);

  return runes;
}
