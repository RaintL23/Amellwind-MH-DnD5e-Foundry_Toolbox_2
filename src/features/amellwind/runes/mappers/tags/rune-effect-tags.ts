/**
 * Rune effect tag extraction — turns armor/weapon effect prose into filterable tags.
 *
 * Tag namespaces:
 * - `class:*`        — class restrictions ("Monk only", …)
 * - `weapon-type:*`  — MH weapon categories (Dual Blades, Bow, …)
 * - `damage:*`       — damage types referenced in text
 * - `type:*`         — offensive / defensive / support / cosmetic / utility
 * - `mechanic:*`     — gameplay mechanics (spells, saves, movement, …)
 *
 * Entry point: `extractRuneEffectTags(effectText, spellLevels?)` → string[].
 * Called once per effect side during mapping; results are stored on `Rune`.
 */
import { usesAcAsSaveReplacement } from "@/features/amellwind/material-effects/utils/inline-ac-bonus-rarity.utils";
import { matchesInlineAbilityScoreSet } from "@/features/amellwind/material-effects/utils/inline-ability-score-set.utils";
import { SKILL_NAME_TO_KEY } from "@/shared/constants/dnd/skills.constants";
import { extractAllDamageTypesFromText } from "@/shared/utils/damage-type-text.utils";
import { matchesFlatDamageReduction, normalizeEffectApostrophes } from "../../utils/rune-damage-reduction.utils";
import {
  resolveSpellLevelsFromText,
  spellTagsFromLevels,
  type SpellLevelLookup,
} from "../../utils/spell-level-lookup.utils";

// ─── Class restriction patterns ──────────────────────────────────────────────

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

// ─── Weapon-type detection (inline mentions + variant list headers) ──────────

/**
 * MH weapon names and category restrictions mentioned in effect text.
 * Order matters: longer / more specific names before shorter ones (Light Bowgun before Bowgun).
 */
const WEAPON_TYPE_MENTIONS: Array<{ tag: string; pattern: RegExp }> = [
  { tag: "weapon-type:light-bowgun", pattern: /\bLight Bowgun\b/i },
  { tag: "weapon-type:heavy-bowgun", pattern: /\bHeavy Bowgun\b/i },
  { tag: "weapon-type:dual-repeaters", pattern: /\bDual Repeaters\b/i },
  { tag: "weapon-type:dual-blades", pattern: /\bDual Blades\b/i },
  { tag: "weapon-type:insect-glaive", pattern: /\bInsect Glaive\b/i },
  { tag: "weapon-type:hunting-horn", pattern: /\bHunting Horn\b/i },
  { tag: "weapon-type:charge-blade", pattern: /\bCharge [Bb]lade\b/ },
  {
    tag: "weapon-type:greatsword",
    pattern: /\bGreat Sword\b|\bGreatsword\b/i,
  },
  { tag: "weapon-type:switchaxe", pattern: /\bSwitch Axe\b|\bSwitchaxe\b/i },
  { tag: "weapon-type:gunlance", pattern: /\bGunlance\b/i },
  { tag: "weapon-type:bowgun", pattern: /\bBowgun\b/i },
  { tag: "weapon-type:tonfas", pattern: /\bTonfas\b/i },
  {
    tag: "weapon-type:sword-and-shield",
    pattern: /\bSword(?: &| and) Shield\b/i,
  },
  { tag: "weapon-type:magus-staff", pattern: /\bMagus Staff\b/i },
  { tag: "weapon-type:hammer", pattern: /\bHammer\b/i },
  { tag: "weapon-type:lance", pattern: /\bLance\b/i },
  { tag: "weapon-type:bow", pattern: /\bBow\b/i },
  {
    tag: "weapon-type:bladed",
    pattern: /\bBladed Weapon(?:\s+[Oo]nly|\s*[)&])/i,
  },
  {
    tag: "weapon-type:melee",
    pattern: /\bMelee Weapon(?:\s+[Oo]nly|\s*[)&])/i,
  },
  {
    tag: "weapon-type:ranged",
    pattern:
      /\bRanged Weapon(?:\s+[Oo]nly|\s*[)&])|\bRange Weapon(?:\s+[Oo]nly|\s*[)&])/i,
  },
];

/** Normalized display names from variant list headers → weapon-type tag. */
const WEAPON_DISPLAY_NAME_TO_TAG: Record<string, string> = {
  "light bowgun": "weapon-type:light-bowgun",
  "heavy bowgun": "weapon-type:heavy-bowgun",
  "dual repeaters": "weapon-type:dual-repeaters",
  "dual blades": "weapon-type:dual-blades",
  "insect glaive": "weapon-type:insect-glaive",
  "hunting horn": "weapon-type:hunting-horn",
  "charge blade": "weapon-type:charge-blade",
  "great sword": "weapon-type:greatsword",
  greatsword: "weapon-type:greatsword",
  "switch axe": "weapon-type:switchaxe",
  switchaxe: "weapon-type:switchaxe",
  gunlance: "weapon-type:gunlance",
  bowgun: "weapon-type:bowgun",
  tonfas: "weapon-type:tonfas",
  hammer: "weapon-type:hammer",
  lance: "weapon-type:lance",
  bow: "weapon-type:bow",
  "sword & shield": "weapon-type:sword-and-shield",
  "sword and shield": "weapon-type:sword-and-shield",
  "magus staff": "weapon-type:magus-staff",
  "bladed weapon": "weapon-type:bladed",
  "melee weapon": "weapon-type:melee",
  "ranged weapon": "weapon-type:ranged",
  "range weapon": "weapon-type:ranged",
};

/**
 * List headers in multi-weapon variant effects:
 * `• Dual Blades.`, `- Charge Blade.`, `(Bow)`, `(Light Bowgun Only)`.
 */
const VARIANT_WEAPON_HEADER_RE =
  /(?:^|[\n\r]|•|-\s*|\()\s*([A-Z][A-Za-z0-9 &']+?)(?:\)|\.(?:\s|$)|\s+[Oo]nly\b)/g;

function resolveWeaponDisplayName(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return WEAPON_DISPLAY_NAME_TO_TAG[key] ?? null;
}

/** Parses weapon names from bullet / parenthetical variant lists. */
function weaponTypeTagsFromVariantHeaders(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(VARIANT_WEAPON_HEADER_RE)) {
    const raw = (match[1] ?? "").trim();
    if (!raw) continue;

    const segments = raw.includes("&")
      ? raw.replace(/\s+[Oo]nly$/, "").split(/\s*&\s*/)
      : [raw.replace(/\s+[Oo]nly$/, "")];

    for (const segment of segments) {
      const tag = resolveWeaponDisplayName(segment);
      if (tag) tags.add(tag);
    }
  }
  return [...tags];
}

/** Emits a weapon-type tag for every MH weapon name or restriction phrase in the text. */
function weaponTypeTags(text: string): string[] {
  const tags = new Set<string>();
  for (const { tag, pattern } of WEAPON_TYPE_MENTIONS) {
    if (pattern.test(text)) tags.add(tag);
  }
  for (const tag of weaponTypeTagsFromVariantHeaders(text)) {
    tags.add(tag);
  }
  if (/(?:range|ranged) weapon attack/i.test(text)) {
    tags.add("weapon-type:ranged");
  }
  return [...tags];
}

// ─── Broad mechanic regex table (first-pass tag sweep) ───────────────────────

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
    /\b\d+[-\s]?foot[-\s]?(?:cone|line|radius|sphere|cube|cylinder)\b|\bwithin \d+[-\s]?feet\b/i,
    "mechanic:area",
  ],
  [/resist(?:ant|ance|ances) to\s+\w/i, "mechanic:resistance"],
  // `mechanic:immunity` — also via `immunityTag()` ("cannot be knocked prone", …)
  [/immune to|immunity to/i, "mechanic:immunity"],
  // mechanic:damage-reduction — also via matchesFlatDamageReduction() after loop
  [/bonus action/i, "mechanic:bonus-action"],
  [/\breaction\b/i, "mechanic:reaction"],
  [/saving throw/i, "mechanic:saving-throw"],
  [
    /\+\d+\s*bonus\s+(?:on|to)\s+(?:strength|dexterity|constitution|intelligence|wisdom|charisma)\s+saving throws?/i,
    "mechanic:save-bonus",
  ],
  [
    /\+\d+\s*bonus\s+(?:on|to)\s+saving throws?/i,
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
  [
    /\+\d+\s*bonus\s+(?:on|to)\s+(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*\([^)]+\)\s*checks?\b/i,
    "mechanic:skill-bonus",
  ],
  [/help action/i, "mechanic:help-action"],
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
  [/\bdisadvantage\b/i, "mechanic:disadvantage"],
  [/\bcantrip\b/i, "mechanic:cantrip"],
  [
    /wyvernfire|dragonpiercer|Guard AC|Mighty Weapon/i,
    "mechanic:class-feature",
  ],
  // Regeneración de extremidades / partes del cuerpo (efecto de curación mayor distinto del HP)
  [
    /(?:regrow|missing part.*grow|body part.*grow|limb.*regrow)/i,
    "mechanic:regeneration",
  ],
  // Recarga o uso ligado a descansos
  [
    /\bshort(?:\s+or\s+long)?\s+rest\b|\{@rest\s+short\}/i,
    "mechanic:short-rest",
  ],
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
    /(?:a\s+)?light and flexible|worn under normal clothes/i.test(text);

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
  /\bas an action\b|use (?:an |your )?action\b|bonus action|\breaction\b|spend (?:one|a|an|\d+) minutes?\b|you can stab\b|Once you use this property\b/i;

// ─── Specialized tag extractors (conditions, skills, movement, spells, …) ────

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

/** damage:fire, damage:cold, etc. — every damage type referenced in the effect text. */
function damageTypeTags(text: string): string[] {
  return extractAllDamageTypesFromText(text).map((type) => `damage:${type}`);
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
  athletic: "athletics",
  acrobatic: "acrobatics",
  acrobatics: "acrobatics",
  tracking: "survival",
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
    const asParenChecks = new RegExp(`\\(${escaped}\\)\\s*checks?\\b`, "i");
    const asAbilityParenChecks = new RegExp(
      `(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\\s*\\(${escaped}\\)\\s*checks?\\b`,
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
    const trackingDisadvantage = new RegExp(
      `\\bdisadvantage\\b[^.]{0,48}\\btrying to track\\b`,
      "i",
    );
    const proficiencyInSkill = new RegExp(
      `proficien(?:t|cy) in (?:the )?${escaped}(?:\\s+skill)?\\b`,
      "i",
    );
    const proficientWithSkill = new RegExp(
      `proficien(?:t|cy) with (?:the )?${escaped}\\b`,
      "i",
    );
    if (
      asChecks.test(lower) ||
      asParenChecks.test(lower) ||
      asAbilityParenChecks.test(lower) ||
      afterBonus.test(lower) ||
      afterAdvantage.test(lower) ||
      proficiencyInSkill.test(lower) ||
      proficientWithSkill.test(lower) ||
      (name === "tracking" && trackingDisadvantage.test(lower))
    ) {
      addSkillName(name);
    }
  }

  if (/\btrying to track you\b/i.test(lower)) {
    addSkillName("tracking");
  }

  if (
    /\bbreak a grapple with you\b/i.test(lower) &&
    /\badvantage\b/i.test(lower) &&
    /\bskill check\b/i.test(lower)
  ) {
    tags.add("mechanic:grapple-contest");
  }

  if (/\(\s*athletics?\s*\)\s*checks?\b/i.test(lower)) {
    addSkillName("athletic");
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

  if (/\battack rolls?\b/i.test(text) || /\bon the attack roll\b/i.test(text)) {
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
  if (
    /Lay on Hands/i.test(text) &&
    /restore a creature'?s? hit points/i.test(text)
  ) {
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

  if (
    /regain hit points from a spell/i.test(text) &&
    /increase the regained amount/i.test(text)
  ) {
    return "mechanic:heal-self-boost";
  }

  if (
    /gain \d+ additional hit points whenever you regain hit points/i.test(text) ||
    /whenever you regain hit points.{0,80}additional hit points/i.test(text)
  ) {
    return "mechanic:heal-self-boost";
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
  /\{@item\s+(?:pitfall traps?\+?|shock traps?\+?|trap tool)\b/i;
const MH_TRAP_BARE = /\b(?:pitfall traps?\+?|shock traps?\+?|trap tool)\b/i;

function itemRelatedTags(text: string): string[] {
  const tags: string[] = [];
  const hasTrap = MH_TRAP_ITEM.test(text) || MH_TRAP_BARE.test(text);
  const hasConjuredItem =
    /\bconjure (?:an |a |two )?[\w\s,-]+(?:Horn|earplugs|totem)\b/i.test(text) ||
    /\bconjure two earplugs\b/i.test(text);
  if (/\{@item\b/i.test(text) || hasTrap || hasConjuredItem) {
    tags.push("mechanic:item-related");
  }
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

  if (
    /\bcatch fish\b|\bcatch any fish\b|fishing pole|fishing spot|sushifish/i.test(
      text,
    )
  ) {
    tags.push("mechanic:fishing");
  }
  if (
    /mining resource|\bmine or gather\b|\bmine ore\b|mineral resource|Mineralogist|Crystallography|buried materials?|\bsense the presence of buried/i.test(
      text,
    )
  ) {
    tags.push("mechanic:mining");
  }
  if (
    /plant resource|herbalist kit to gather plants|\bHoney Hunter\b|when you eat an herb|\bHerbology\b/i.test(
      text,
    )
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

  const hasYieldImprovement =
    /when you (?:successfully )?(?:gather|catch|mine)\b|instead (?:gather|catch)|catch two|gather 2|gather an extra|catch an extra|extra 1d4|double the (?:normal )?number|gather double|doesn't count against the maximum|gain double the amount|take the higher of the two|gather two of that|roll 2d6 and take the higher/i.test(
      text,
    );

  const hasNamedGatherSkill =
    /\b(?:Botanist|Geologist|Expert Fisherman|Mineralogist|Honey Hunter|Entomologist|Pack Rat|Speed Gatherer|Hunter Gatherer)\b/i.test(
      text,
    );

  const hasMaterialSense = /sense the presence of buried/i.test(text);

  if (tags.length === 0 && !isGeneralGather) return [];

  if (
    hasYieldImprovement ||
    hasNamedGatherSkill ||
    isGeneralGather ||
    hasMaterialSense
  ) {
    tags.push("mechanic:gather-resources");
  }

  if (
    /extra 1d4|instead (?:gather|catch) 1d4|gather 1d4|catch an? extra 1d4|an extra 1d4 more|1d4 additional resources|double the (?:normal )?number|gather double|doesn't count against the maximum|gain double the amount|take the higher of the two|gather two of that|roll 2d6 and take the higher/i.test(
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

  const suppressesLight =
    /\bsnuff(?:ing|s)?\b/i.test(text) ||
    /\bdraws in light\b/i.test(text) ||
    /extinguish(?:es)? (?:all )?nonmagical flames/i.test(text) ||
    /turns dim light into darkness/i.test(text) ||
    /turns bright light into dim light/i.test(text);
  if (suppressesLight) tags.push("mechanic:light-suppression");

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
  if (
    /\bclimb(?:ing)? speed\b/i.test(text) ||
    /\bSpider Climb\b/i.test(text) ||
    /move up, down, and across vertical surfaces/i.test(text) ||
    /upside down along ceilings/i.test(text)
  ) {
    tags.push("mechanic:climbing");
  }
  if (
    /walking speed (?:increases|becomes|doubles)|your (?:movement )?speed increases|(?:movement )?speed is doubled/i.test(
      text,
    )
  ) {
    tags.push("mechanic:walking-speed");
  }

  if (
    /(?:movement )?speed is doubled whenever you use your movement/i.test(text)
  ) {
    tags.push("mechanic:conditional-speed");
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
    /do not suffer from difficult terrain/i.test(text) ||
    /difficult terrain.{0,60}doesn'?t cost .{0,20}extra (?:movement|moment)/i.test(
      text,
    )
  ) {
    tags.push("mechanic:ignore-difficult-terrain");
  }

  if (
    /move up to \d+ feet without provoking opportunity attacks/i.test(text) ||
    /without provoking opportunity attacks/i.test(text)
  ) {
    tags.push("mechanic:no-opportunity-attacks");
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

  if (
    /lightly obscured.{0,100}disadvantage on your Wisdom \(Perception\)/i.test(
      text,
    )
  ) {
    return "mechanic:against-condition";
  }

  // "against being stunned", "against the poisoned condition", "against paralysis"
  if (
    new RegExp(
      `saving throws? against (?:being\\b|(?:the )?(?:${CONDITION_TERM_ALT})(?:\\s+condition)?\\b|\\{@condition)`,
      "i",
    ).test(text) ||
    /saving throws? against poison\b/i.test(text) ||
    /saving throws? made against harmful gases/i.test(text)
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
  if (
    /(?:regrow|missing part.*grow|body part.*grow|limb.*regrow)/i.test(text)
  ) {
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
  if (
    /\bgain the benefits of the .+ spell\b/i.test(text) ||
    /\beffects of the .+ spell\b/i.test(text) ||
    /\bacts as the .+ spell\b/i.test(text)
  ) {
    return true;
  }
  const hasSpellOrCantrip =
    /\bspell\b/i.test(text) || /\bcantrip\b/i.test(text);
  if (!hasSpellOrCantrip) return false;
  return /\bcast(?:s|ing)?\b/i.test(text) || /\bknow(?:s|ing)?\b/i.test(text);
}

/** MHMM spell names referenced without `{@spell}` markup. */
const KNOWN_PLAIN_SPELL_LEVELS: Array<[RegExp, number]> = [
  [/\bhaste\b/i, 3],
  [/heroes['']?\s*feast/i, 6],
  [/feather fall/i, 1],
  [/freedom of movement/i, 4],
];

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

  for (const [pattern, level] of KNOWN_PLAIN_SPELL_LEVELS) {
    if (pattern.test(text)) {
      return [`mechanic:spell:lvl${level}`];
    }
  }

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

  return alwaysPrepared || freePrepareSlot ? "mechanic:spell:prepared" : null;
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
  return cleansesAtTurnStart || describesDotCleanse ? "mechanic:end-dot" : null;
}

/**
 * type:cosmetic   → MHMM "(Cosmetic)" prefix — visual / flavor only, no mechanical benefit
 * type:offensive  → más daño (extra damage, named criticals, buffs de ataque/daño)
 * type:defensive  → menos daño recibido o bonus de AC
 * type:support    → ayuda a aliados o menciona criaturas willing
 *
 * Rolling a 20 alone is not offensive: a 5-foot push with no damage stays untyped.
 */
function cosmeticTag(text: string): string | null {
  let trimmed = text.trim();
  if (!/^\(Cosmetic/i.test(trimmed)) {
    trimmed = trimmed.replace(/^\([^)]*only\)\s*/i, "").trim();
  }
  return /^\(Cosmetic(?:\s*;[^)]+)?\)/i.test(trimmed) ? "type:cosmetic" : null;
}

function typeTags(text: string): string[] {
  const tags: string[] = [];

  const cosmetic = cosmeticTag(text);
  if (cosmetic) {
    tags.push(cosmetic);
    return tags;
  }

  if (/willing creature/i.test(text)) {
    tags.push("type:support");
  } else if (
    /(?:another|friendly|allied|ally|allies)\s+(?:creature|target)/i.test(
      text,
    ) &&
    /(?:regain|restore|grant|give|heal|advantage on|temporary hit points)/i.test(
      text,
    )
  ) {
    tags.push("type:support");
  } else if (
    /all other creatures within a \d+-foot radius of you gain its effect/i.test(
      text,
    )
  ) {
    tags.push("type:support");
  } else if (healOtherTag(text) != null) {
    tags.push("type:support");
  } else if (
    /(?:NPC )?allies within \d+ feet of you gain a \+\d+ bonus to their AC and attack rolls/i.test(
      text,
    )
  ) {
    tags.push("type:support");
  } else if (/throw a willing ally/i.test(text)) {
    tags.push("type:support");
  } else if (
    /regain hit points from a spell/i.test(text) &&
    /increase the regained amount/i.test(text)
  ) {
    tags.push("type:support");
  } else if (
    /friendly creature who can see or hear you/i.test(text) &&
    /\breaction\b[^.]{0,100}\bmove up to half its speed\b/i.test(text)
  ) {
    tags.push("type:support");
  } else if (
    /help action|aided ally|treat its weapon as a \+\d+ magic weapon/i.test(
      text,
    )
  ) {
    tags.push("type:support");
  }

  const isDefensive =
    /\bAC\b|armor class/i.test(text) ||
    /\bbase Armor Class is \d+/i.test(text) ||
    /resist(?:ant|ance|ances) to\s+\w/i.test(text) ||
    /immune to|immunity to/i.test(text) ||
    conditionImmunityCannotBeTag(text) != null ||
    endDotTag(text) != null ||
    matchesFlatDamageReduction(text) ||
    /Guard AC/i.test(text) ||
    /critical hit against you becomes a normal hit/i.test(text) ||
    /halve the (?:attack'?s? )?damage against you/i.test(text) ||
    /ignore the effects of the first \d+ levels? of exhaustion/i.test(text) ||
    /reduce your exhaustion by \d+ levels? instead of/i.test(text) ||
    /advantage on saving throws against spells/i.test(text) ||
    /\+\d+\s*bonus\s+(?:on|to)\s+(?:(?:strength|dexterity|constitution|intelligence|wisdom|charisma)\s+)?saving throws?/i.test(
      text,
    ) ||
    /\+\d+\s*bonus\s+(?:on|to)\s+\w+\s+saving throws?/i.test(text) ||
    (/saving throw/i.test(text) &&
      /\badvantage\b/i.test(text) &&
      !/\bdisadvantage\b/i.test(text)) ||
    (/saving throw/i.test(text) &&
      /do so with (?:a )?\+\d+\s*bonus/i.test(text)) ||
    (/\badvantage\b/i.test(text) && /against being disarmed/i.test(text)) ||
    (/\bturn invisible\b/i.test(text) &&
      /\b(?:reaction|take damage)\b/i.test(text)) ||
    (/\bdisadvantage\b/i.test(text) &&
      /\btrying to track you\b/i.test(text)) ||
    /\bdisadvantage on attack rolls? against you\b/i.test(text) ||
    /suffer no ill effects from strong winds?/i.test(text) ||
    /reroll any 1s or 2s on the healing dice/i.test(text) ||
    /reduce the distance you are moved by up to/i.test(text) ||
    /pass a (?:\w+\s+)?saving throw you otherwise would have failed/i.test(
      text,
    ) ||
    /(?:don't|do not|doesn't|does not) provoke opportunity attacks/i.test(text) ||
    (/reaction to (?:take the |use the )?shove action/i.test(text) &&
      /hits? you with a melee weapon attack/i.test(text));

  if (isDefensive) tags.push("type:defensive");

  const incomingCritNegation =
    /critical hit against you becomes a normal hit/i.test(text);

  const isOffensive =
    !incomingCritNegation &&
    (/extra (?:\{@damage|\d+d\d+)/i.test(text) ||
      (CRITICAL_WORD_RE.test(text) && !incomingCritNegation) ||
      /\+\d+\s*bonus.*(?:attack|damage)/i.test(text) ||
      /(?:attack|damage) roll.*\+\d+/i.test(text) ||
      /spell attack\s+roll|spell damage|damage roll/i.test(text) ||
      /roll one additional damage die|additional damage die for the elemental/i.test(
        text,
      ) ||
      /pull(?:s)? (?:the )?(?:target|creature)?\s*\d+\s*feet/i.test(text) ||
      /changes the damage type your weapon deals/i.test(text) ||
      /deal \w+ damage instead of its normal damage type/i.test(text) ||
      (PUSH_RE.test(text) && /(?:when you hit|on a hit)/i.test(text)) ||
      /make (?:one|two) additional attacks?|make another attack|make two attacks instead of one/i.test(
        text,
      ) ||
      (/\{@condition/i.test(text) &&
        /(?:hit|attack|strike|on a hit)/i.test(text)) ||
      (new RegExp(
        `(?:when you hit|on a hit).{0,120}\\b(?:${CONDITION_TERM_ALT})\\b`,
        "i",
      ).test(text) &&
        /saving throw/i.test(text)) ||
      new RegExp(
        String.raw`(?:deals?|dealing|extra|takes?|taking)\s+(?:an?\s+)?(?:additional\s+)?${DAMAGE_AMOUNT.source}`,
        "i",
      ).test(text) ||
      (/\{@spell/i.test(text) && /deals?\s+\w+\s+damage/i.test(text)) ||
      /deals? \w+ damage equal to \d+d\d+/i.test(text) ||
      (/\badvantage\b/i.test(text) &&
        /\b(?:the )?attack rolls?\b/i.test(text) &&
        !/\bdisadvantage\b/i.test(text)) ||
      (/regains half as many/i.test(text) &&
        /when you hit a creature/i.test(text)) ||
      (/coat this weapon with poison/i.test(text) &&
        /save DC is increased by/i.test(text)) ||
      /fail(?:s)? the saving throw by \d+ or more/i.test(text) ||
      /when you (?:poison|paralyze) a creature/i.test(text) ||
      /deals extra damage equal to/i.test(text) ||
      (/\bdisadvantage on the save\b/i.test(text) &&
        (/\bhidden\b/i.test(text) || /ally is within \d+ feet/i.test(text))) ||
      /demon ammo.{0,60}(?:duration and )?effect (?:is|are) doubled/i.test(
        text,
      ) ||
      /reduce the damage you deal by half to grapple/i.test(text));

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

/** Replicates a published potion ("same benefits as a potion of …"). */
function potionEffectTag(text: string): string | null {
  return /same benefits as a potion of/i.test(text)
    ? "mechanic:potion-effect"
    : null;
}

/** Multi-day / multi-week recharge gates (distinct from long-rest wording). */
function extendedRechargeTag(text: string): string | null {
  if (
    /can(?:not|'t) use (?:it |this property )?again for \d+ (?:days?|weeks?)/i.test(
      text,
    )
  ) {
    return "mechanic:recharge-extended";
  }
  if (
    /can(?:not|'t) use (?:it |this property )?again for \d+ hours?/i.test(text) ||
    /no more than once per hour/i.test(text) ||
    /once per hour/i.test(text) ||
    /can't use this property again for 1 hour/i.test(text)
  ) {
    return "mechanic:recharge-hourly";
  }
  return null;
}

/** Grants proficiency in a skill, tool/kit, or instrument; expertise doubles PB. */
function proficiencyGrantTags(text: string): string[] {
  const tags: string[] = [];

  if (/double your proficiency bonus when using/i.test(text)) {
    tags.push("mechanic:expertise");
  }

  if (
    /proficien(?:t|cy) with (?:cook's |[\w'-]+(?:'s)? )?[\w'-]+ utensils/i.test(
      text,
    ) ||
    /proficien(?:t|cy) with (?:either )?(?:[\w'-]+(?:'s)? supplies|tinker'?s tools|artisan tools|herbalism kit|[\w\s]+ kit)/i.test(
      text,
    ) ||
    /gain proficien(?:t|cy) with (?:two |three )?artisan tools/i.test(text)
  ) {
    tags.push("mechanic:proficiency-tool");
  }

  if (
    /proficien(?:t|cy) with (?:the )?[\w'-]+(?: musical)? instruments?\b/i.test(
      text,
    ) ||
    /gain proficien(?:t|cy) with (?:the )?horn musical instruments/i.test(text)
  ) {
    tags.push("mechanic:proficiency-instrument");
  }

  if (
    /(?:you )?have proficien(?:t|cy) in the [\w]+ skill/i.test(text) ||
    /gain proficien(?:t|cy) in the [\w]+ skill/i.test(text)
  ) {
    tags.push("mechanic:proficiency-skill");
  }

  return tags;
}

/** Heroic inspiration (not bardic inspiration). */
function inspirationTag(text: string): string | null {
  if (/\bbardic inspiration\b/i.test(text)) return null;
  return /\bgain inspiration\b/i.test(text) ? "mechanic:inspiration" : null;
}

/** Poison applied to the weapon gets a higher save DC. */
function poisonDcBoostTag(text: string): string | null {
  return /coat this weapon with poison/i.test(text) &&
    /save DC is increased by/i.test(text)
    ? "mechanic:poison-dc-boost"
    : null;
}

/** Save DC for condition-causing effects / material effects (broader than spell save DC). */
function saveDcBoostTag(text: string): string | null {
  return /save DC for condition causing effects/i.test(text) ||
    /your save DC for condition causing effects/i.test(text)
    ? "mechanic:save-dc-boost"
    : null;
}

/** Reaction to reduce forced movement along the ground. */
function forcedMovementReductionTag(text: string): string | null {
  return /reduce the distance you are moved by up to/i.test(text)
    ? "mechanic:forced-movement-reduction"
    : null;
}

/** Action / BA conjure a temporary item into your hands. */
function conjureItemTag(text: string): string | null {
  return /\bconjure (?:an |a |two )?[\w\s,-]+(?:Horn|earplugs|totem)\b/i.test(text)
    ? "mechanic:conjure-item"
    : null;
}

/** Resistance / immunity to all nonmagical damage. */
function nonmagicalDamageDefenseTags(text: string): string[] {
  const tags: string[] = [];
  if (/resist(?:ant|ance) to nonmagical damage/i.test(text)) {
    tags.push("mechanic:resistance", "mechanic:nonmagical-damage-defense");
  }
  if (/immune to nonmagical damage/i.test(text)) {
    tags.push("mechanic:immunity", "mechanic:nonmagical-damage-defense");
  }
  return tags;
}

/** Multi-weapon material with per-weapon benefits (Power Prolonger, Shield Upgrade, Blast Coat, …). */
const WEAPON_VARIANT_PHRASING_RE =
  /depending on which weapon (?:this material is placed (?:into|in)|it is placed in)|one of the following (?:weapon|armor) properties depending on which weapon it is placed in|when placed in a specific weapon it gains one of the following|placed into a weapon choose one of the following/i;

function weaponVariantTag(text: string): string | null {
  return WEAPON_VARIANT_PHRASING_RE.test(text)
    ? "mechanic:weapon-variant"
    : null;
}

/** Cross-type bowgun ammo access (LBG ↔ HBG ammo swap). */
function ammoUnlockTag(text: string): string | null {
  return /can now use the (?:heavy|light) bowgun'?s/i.test(text)
    ? "mechanic:ammo-unlock"
    : null;
}

/** Herb / consumable die upgrade when eating field herbs. */
function herbConsumptionTag(text: string): string | null {
  return /when you eat an herb/i.test(text) ||
    /instead of rolling 1d4 when you eat an herb/i.test(text)
    ? "mechanic:herb-consumption"
    : null;
}

/** Share a consumable's effect with nearby creatures (Dreadqueen). */
function consumableShareTag(text: string): string | null {
  return /all other creatures within a \d+-foot radius of you gain its effect/i.test(
    text,
  )
    ? "mechanic:consumable-share"
    : null;
}

/** Trigger on a missed weapon attack (Hunting Horn Jingle). */
function missTriggerTag(text: string): string | null {
  return /when you miss a hostile creature with this weapon/i.test(text)
    ? "mechanic:miss-trigger"
    : null;
}

/** Unarmored base AC formula — not a flat +N bonus. */
function baseAcTag(text: string): string | null {
  return /\bbase Armor Class is \d+/i.test(text) ? "mechanic:base-ac" : null;
}

/** Extra limbs that enable additional unarmed strikes. */
function extraLimbsTag(text: string): string | null {
  return /\b(?:grow )?(?:two )?additional arms?\b|\bextra arms?\b/i.test(text)
    ? "mechanic:extra-limbs"
    : null;
}

function prehensileTailTag(text: string): string | null {
  return /\b(?:grow )?a monkey-like tail\b|\bmonkey-like tail\b/i.test(text)
    ? "mechanic:prehensile-tail"
    : null;
}

function healingRerollTag(text: string): string | null {
  return /reroll any 1s or 2s on the healing dice/i.test(text)
    ? "mechanic:healing-reroll"
    : null;
}

function woundCritTag(text: string): string | null {
  return /(?:score )?a critical hit against a target with a wound/i.test(text)
    ? "mechanic:wound-crit"
    : null;
}

function unarmedUpgradeTag(text: string): string | null {
  return /unarmed strikes deal \w+ damage instead of \w+ damage/i.test(text) ||
    /use a d\d in place of the normal weapon damage dice with unarmed strikes/i.test(
      text,
    )
    ? "mechanic:unarmed-upgrade"
    : null;
}

function healingReductionTags(text: string): string[] {
  const tags: string[] = [];
  if (/regain half as many|regains half as many/i.test(text)) {
    tags.push("mechanic:healing-reduction");
  }
  if (/can(?:not|'t) regain hit points until/i.test(text)) {
    tags.push("mechanic:healing-reduction:major");
  }
  if (/can only be closed by magical healing/i.test(text)) {
    tags.push("mechanic:wound-lock");
  }
  return tags;
}

function craftingMaxTag(text: string): string | null {
  return /succeed on crafting.*maximum number possible|gain the maximum number possible/i.test(
    text,
  )
    ? "mechanic:crafting-max"
    : null;
}

function goldDoubleTag(text: string): string | null {
  return /gold you receive.*magically doubles|reward magically doubles/i.test(text)
    ? "mechanic:gold-double"
    : null;
}

function abilityScoreSetTag(text: string): string | null {
  return matchesInlineAbilityScoreSet(text)
    ? "mechanic:ability-score-set"
    : null;
}

function abilityScoreIncreaseTag(text: string): string | null {
  if (matchesInlineAbilityScoreSet(text)) return null;

  return /(?:increase|increases)\s+your\s+(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+score\s+by\s+\d+/i.test(
    text,
  )
    ? "mechanic:ability-score-increase"
    : null;
}

function improvisedProficiencyTag(text: string): string | null {
  return /proficien(?:t|cy) with improvised weapons/i.test(text)
    ? "mechanic:proficiency-improvised"
    : null;
}

function chargeAttackTag(text: string): string | null {
  return /move \d+ feet in a straight line/i.test(text) &&
    /\+\d+\s*bonus.*attack rolls?/i.test(text)
    ? "mechanic:charge-attack"
    : null;
}

function materialSenseTag(text: string): string | null {
  if (/hidden doors or passages|secret doors or passages/i.test(text)) {
    return "mechanic:hidden-sense";
  }
  return /sense the presence of buried materials?|sense buried materials?/i.test(
    text,
  )
    ? "mechanic:material-sense"
    : null;
}

function breatheAnyEnvironmentTag(text: string): string | null {
  return /breathe normally in any environment/i.test(text)
    ? "mechanic:breathe-any-environment"
    : null;
}

const EXTRA_USES_BETWEEN_RESTS_RE =
  /(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+additional times? between rests/i;

function classFeatureExtraUseTag(text: string): string | null {
  return EXTRA_USES_BETWEEN_RESTS_RE.test(text) &&
    (/Mighty Weapon|dragonpiercer|channel divinity|class feature|skill/i.test(
      text,
    ) ||
      /additional time between rests/i.test(text))
    ? "mechanic:class-feature-extra-use"
    : null;
}

/** MH carve loot checks (Dexterity Survival vs Carve DC). */
function carveCheckTags(text: string): string[] {
  if (!/\bcarve checks?\b/i.test(text)) return [];
  return ["mechanic:carve"];
}

/** Advantage or flat bonus on saves vs attacks/spells of a damage type. */
function againstDamageSaveTag(text: string): string | null {
  if (
    /saving throws? against (?:an )?(?:attack|spell)/i.test(text) &&
    /deals? \w+ damage/i.test(text) &&
    (/\badvantage\b/i.test(text) || /\+\d+\s*bonus/i.test(text))
  ) {
    return "mechanic:against-damage";
  }
  return null;
}

/** Blindsight / truesight / tremorsense grants on equipment. */
function specialSenseTags(text: string): string[] {
  const tags: string[] = [];
  if (/\bblindsight\b/i.test(text)) tags.push("mechanic:blindsight");
  if (/\btruesight\b/i.test(text)) tags.push("mechanic:truesight");
  if (/\btremorsense\b/i.test(text)) tags.push("mechanic:tremorsense");
  return tags;
}

/** Glows when named creatures are within N feet (Glavenus hunter sense). */
function creatureProximityTag(text: string): string | null {
  return /glows? faintly when .{3,160}? is near \(\d+ feet or less\)/i.test(
    text,
  )
    ? "mechanic:creature-proximity"
    : null;
}

/** Displacement / shadow shroud — disadvantage on attacks against you until hit. */
function displacementTag(text: string): string | null {
  if (/\bdisadvantage on attack rolls? against you\b/i.test(text)) {
    return "mechanic:displacement";
  }
  return null;
}

/** On-hit grant an ally a reaction move without OAs from the attack target. */
function allyReactionMoveTag(text: string): string | null {
  return /friendly creature who can see or hear you/i.test(text) &&
    /\breaction\b[^.]{0,100}\bmove up to half its speed\b/i.test(text)
    ? "mechanic:ally-reaction-move"
    : null;
}

function extraAttackTag(text: string): string | null {
  return /make (?:one|two) additional attacks?|make another attack|make two attacks instead of one/i.test(
    text,
  )
    ? "mechanic:extra-attack"
    : null;
}

function creatureSenseTag(text: string): string | null {
  if (
    /in contact with a web.{0,120}know the (?:exact )?location/i.test(text) ||
    /know the (?:exact )?location.{0,120}in contact with the same web/i.test(
      text,
    )
  ) {
    return "mechanic:web-sense";
  }
  return /know the location of all creatures within \d+ feet/i.test(text)
    ? "mechanic:creature-sense"
    : null;
}

function hiddenSenseTag(text: string): string | null {
  return /hidden doors or passages|secret doors or passages/i.test(text)
    ? "mechanic:hidden-sense"
    : null;
}

function noOpportunityAttacksTag(text: string): string | null {
  return /(?:don't|do not|doesn't|does not) provoke opportunity attacks/i.test(
    text,
  )
    ? "mechanic:no-opportunity-attacks"
    : null;
}

function saveRerollTag(text: string): string | null {
  return /pass a (?:\w+\s+)?saving throw you otherwise would have failed/i.test(
    text,
  )
    ? "mechanic:save-reroll"
    : null;
}

function saveFailureMarginTag(text: string): string | null {
  return /fail(?:s)? the saving throw by \d+ or more/i.test(text)
    ? "mechanic:save-failure-margin"
    : null;
}

function skillBonusActionTag(text: string): string | null {
  return /(?:\([\w\s]+\)|\{@skill[^}]+\})\s*checks?\s+as a bonus action/i.test(
      text,
    ) ||
    /bonus action.{0,80}(?:\([\w\s]+\)|Intelligence \(History\)|\{@skill)\s*checks?/i.test(
      text,
    )
    ? "mechanic:skill-bonus-action"
    : null;
}

function chargeMovementTag(text: string): string | null {
  return /bonus action to move.{0,80}towards? an enemy/i.test(text)
    ? "mechanic:charge-movement"
    : null;
}

function compositeEffectTag(text: string): string | null {
  return /gain the benefits of both (?:the )?[\w\s+'-]+ and [\w\s+'-]+(?: weapon)? material effects?/i.test(
    text,
  )
    ? "mechanic:composite-effect"
    : null;
}

function weaponClassModeTag(text: string): string | null {
  return /(?:Archdemon|Demon) Mode is always active|(?:Archdemon|Demon)\/Archdemon Mode duration is increased|damage die of your archdemon mode increases/i.test(
    text,
  )
    ? "mechanic:weapon-class-mode"
    : null;
}

function hpSacrificeTag(text: string): string | null {
  return /hit point maximum is reduced by/i.test(text) &&
    /deals extra damage equal to/i.test(text)
    ? "mechanic:hp-sacrifice"
    : null;
}

function woundStaunchTag(text: string): string | null {
  return /DC to staunch a wound/i.test(text)
    ? "mechanic:wound-staunch"
    : null;
}

function conditionalFlavorTag(text: string): string | null {
  if (
    !/reduced to half of your hit point maximum or less/i.test(text) &&
    !/below half of your (?:maximum )?hit points/i.test(text)
  ) {
    return null;
  }
  const hasMechanicalPayoff =
    /\bgain\b|\bdeals?\b|\bbonus\b|\badvantage\b|\bincrease(?:s|d)?\b|\bextra damage\b/i.test(
      text,
    );
  return hasMechanicalPayoff ? null : "mechanic:conditional-flavor";
}

function vulnerabilityTag(text: string): string | null {
  return /vulnerable to \w+ damage/i.test(text)
    ? "mechanic:vulnerability"
    : null;
}

function consumableExtendTag(text: string): string | null {
  return /duration of consumable items is doubled/i.test(text)
    ? "mechanic:consumable-extend"
    : null;
}

function signalFlareTag(text: string): string | null {
  return /shoot a harmless spark of lightning|harmless spark.*visible for up to/i.test(
    text,
  )
    ? "mechanic:signal-flare"
    : null;
}

function iceReservoirTag(text: string): string | null {
  return /reservoir of ice magic|plant (?:the |this )?weapon in the ground.*ice magic|plant the weapon in the ground, releasing the ice magic/i.test(
    text,
  )
    ? "mechanic:ice-reservoir"
    : null;
}

function blightSwapTag(text: string): string | null {
  return /inflict \w+blight instead of (?:the poisoned condition|\w+blight)/i.test(
    text,
  )
    ? "mechanic:blight-swap"
    : null;
}

function ammoCapacityTag(text: string): string | null {
  return /(?:normal )?ammo capacity doubles|coat up to \d+ additional arrows|ammo pouch can hold double/i.test(
    text,
  )
    ? "mechanic:ammo-capacity"
    : null;
}

function magicResistanceTags(text: string): string[] {
  const tags: string[] = [];
  if (
    /advantage on saving throws against spells(?:\s+and other magical effects)?/i.test(
      text,
    )
  ) {
    tags.push("mechanic:magic-resistance");
  }
  if (/spell attacks have disadvantage against you/i.test(text)) {
    tags.push("mechanic:spell-attack-disadvantage");
  }
  return tags;
}

function critNegationTag(text: string): string | null {
  return /critical hit against you becomes a normal hit/i.test(text)
    ? "mechanic:crit-negation"
    : null;
}

function forcedMovementTags(text: string): string[] {
  if (
    !/pull(?:s)? (?:the )?(?:target|creature)?\s*\d+\s*feet/i.test(text) &&
    !/pull(?:s)? (?:the )?(?:target|creature) \d+ feet/i.test(text)
  ) {
    return [];
  }
  return ["mechanic:forced-movement"];
}

function jumpMovementTag(text: string): string | null {
  if (
    /jump and grab/i.test(text) &&
    /does not count against your movement/i.test(text)
  ) {
    return "mechanic:jump-movement";
  }
  return null;
}

function exhaustionMitigationTag(text: string): string | null {
  return /ignore the effects of the first \d+ levels? of exhaustion/i.test(text)
    ? "mechanic:exhaustion-mitigation"
    : null;
}

function elementalExtraDieTag(text: string): string | null {
  return /roll one additional damage die|additional damage die for the elemental|damage dice one additional time/i.test(
    text,
  )
    ? "mechanic:extra-damage-die"
    : null;
}

function planeShiftTag(text: string): string | null {
  return /enter the (?:elemental )?plane of|return to the plane you were on/i.test(
    text,
  )
    ? "mechanic:plane-shift"
    : null;
}

/** Flavor-only appearance / upkeep — no damage, AC, or save riders. */
function flavorCosmeticTag(text: string): string | null {
  if (/^\(Cosmetic(?:\s*;[^)]+)?\)/i.test(text.trim())) return null;

  const hasMechanicalRider =
    /\bdeals an extra\b|\bbonus to damage\b|\+\d+\s*to damage|\+\d+\s*bonus to (?:your )?AC\b/i.test(
      text,
    ) ||
    /\bsuffer no ill effects? from/i.test(text) ||
    /hidden doors or passages/i.test(text);

  const isDirtyFlavor =
    /\b(?:always dirty|muddy footprints|pile of dirt)\b/i.test(text);
  const isMaintenanceFlavor =
    /never needs maintenance|cannot rust or tarnish/i.test(text);
  const isAppearanceFlavor =
    /\b(?:glow|glowing)\b.*\b(?:at night|in darkness)\b/i.test(text) ||
    /\b(?:eyes|skin)\b.*\b(?:glow|take on the appearance)\b/i.test(text) ||
    /\bveins\b[^.]{0,80}\bturn\b/i.test(text) ||
    /read books you are touching while sleeping/i.test(text) ||
    /safely swallow it instead of sheathing/i.test(text) ||
    /take on the appearance of/i.test(text) ||
    /layer of crystals forms/i.test(text) ||
    /glimmers in the light/i.test(text) ||
    /refract the surrounding light/i.test(text) ||
    /embers dance in the air around you/i.test(text) ||
    /dull tip spines/i.test(text) ||
    /penguin emblem/i.test(text) ||
    /(?:your )?breath becomes visible/i.test(text) ||
    /frost continually forms on the surface/i.test(text);
  const isSteamFlavor =
    /\bsteam radiates\b/i.test(text) ||
    /\bminute explosions around you\b/i.test(text);
  const isSurfaceMarkFlavor =
    /\b(?:colored )?marks on any surface\b/i.test(text) ||
    /\bmarks will fade away\b/i.test(text);

  if (hasMechanicalRider) return null;
  if (
    isDirtyFlavor ||
    isMaintenanceFlavor ||
    isAppearanceFlavor ||
    isSteamFlavor ||
    isSurfaceMarkFlavor
  ) {
    return "type:cosmetic";
  }
  return null;
}

function glideTag(text: string): string | null {
  if (
    /gliding membrane/i.test(text) ||
    /(?:reduce|slow) (?:your )?(?:fall speed|descent)/i.test(text) ||
    /falling damage and land on your feet/i.test(text) ||
    /take no falling damage/i.test(text)
  ) {
    return "mechanic:glide";
  }
  return null;
}

function windResistTag(text: string): string | null {
  return /suffer no ill effects from strong winds?/i.test(text)
    ? "mechanic:wind-resist"
    : null;
}

function conditionSuppressTag(text: string): string | null {
  return /suppresses the effects of the \w+ condition/i.test(text)
    ? "mechanic:condition-suppress"
    : null;
}

function languageProficiencyTag(text: string): string | null {
  return /proficien(?:t|cy) in any(?: two)? languages?/i.test(text)
    ? "mechanic:proficiency-language"
    : null;
}

function disengageHideTag(text: string): string | null {
  return /take the disengage or hide action/i.test(text)
    ? "mechanic:disengage-hide"
    : null;
}

function antiTrackingTag(text: string): string | null {
  return /\bdisadvantage\b/i.test(text) && /\btrying to track you\b/i.test(text)
    ? "mechanic:anti-tracking"
    : null;
}

function exhaustionRecoveryTag(text: string): string | null {
  return /reduce your exhaustion by \d+ levels? instead of/i.test(text)
    ? "mechanic:exhaustion-recovery"
    : null;
}

function invisibilityReactionTag(text: string): string | null {
  return /\bturn invisible\b/i.test(text) && /\breaction\b/i.test(text)
    ? "mechanic:invisibility-reaction"
    : null;
}

function psychoserumExtendTag(text: string): string | null {
  return /psychoserum/i.test(text) &&
    /effects last an additional/i.test(text)
    ? "mechanic:psychoserum-extend"
    : null;
}

function weaponModeSwitchTag(text: string): string | null {
  return /switch its modes as a free action|switch modes as a free action/i.test(
    text,
  )
    ? "mechanic:weapon-mode"
    : null;
}

function degradingAcTag(text: string): string | null {
  return /increasing your AC by \+?\d+.*(?:each time you are hit|reducing the bonus)/i.test(
    text,
  )
    ? "mechanic:degrading-ac"
    : null;
}

function conditionalAcTag(text: string): string | null {
  return /below half of your (?:maximum )?hit points.*(?:increase|increasing) your AC by/i.test(
    text,
  )
    ? "mechanic:conditional-ac"
    : null;
}

function itemTransformTag(text: string): string | null {
  if (
    /transform(?:ing)? it into a (?:telescope|magnifying glass|fishing pole)/i.test(
      text,
    )
  ) {
    return "mechanic:item-transform";
  }
  if (
    /speak(?:ing)? (?:the |a )?command word/i.test(text) &&
    /transform it into/i.test(text)
  ) {
    return "mechanic:item-transform";
  }
  return null;
}

function allyAuraTag(text: string): string | null {
  return /(?:NPC )?allies within \d+ feet of you gain a \+\d+ bonus to their AC and attack rolls/i.test(
    text,
  )
    ? "mechanic:ally-aura"
    : null;
}

function allyThrowTag(text: string): string | null {
  return /throw a willing ally/i.test(text) ? "mechanic:ally-throw" : null;
}

function powerhouseTag(text: string): string | null {
  return /reaction that increases your AC and causes an attack that would hit to miss/i.test(
    text,
  )
    ? "mechanic:powerhouse"
    : null;
}

function summonTag(text: string): string | null {
  return /\bsummon\b/i.test(text) ? "mechanic:summon" : null;
}

function damageTypeShiftTag(text: string): string | null {
  return /deal \w+ damage instead of its normal damage type|changes the damage type your weapon deals/i.test(
    text,
  )
    ? "mechanic:damage-type-shift"
    : null;
}

function dragonpiercerTag(text: string): string | null {
  return /dragonpiercer/i.test(text) ? "mechanic:dragonpiercer" : null;
}

function critNoReactionsTag(text: string): string | null {
  if (/frightened|wave of terror|saving throw or become/i.test(text)) {
    return null;
  }
  return /(?:critically hit with this weapon|roll a 20 for the attack roll).*can(?:not|'t) take reactions/i.test(
      text,
    ) ||
    /when you critically hit.*can(?:not|'t) take reactions/i.test(text)
    ? "mechanic:crit-no-reactions"
    : null;
}

function resistanceBypassTags(text: string): string[] {
  const tags: string[] = [];
  const spellBypass =
    /\b(?:spells?|fire spells?|cold spells?|lightning spells?|acid spells?|poison spells?|thunder spells?)\b.*\bbypass\b/i.test(
      text,
    ) ||
    /\bbypass\b.*\bspells?\b/i.test(text) ||
    /(?:cold|fire|lightning|acid|poison|thunder).*spells.*bypass/i.test(text);
  const attackBypass =
    /(?:attacks with this weapon|your weapon attacks|weapon'?s attacks|weapon attacks)\b.*\bbypass\b/i.test(
      text,
    ) ||
    /\bbypass\b.*(?:damage resistances?|resistance to \w+ damage)/i.test(
      text,
    ) ||
    /bypass(?:es)? a creatures?['']?s?\s+resistance/i.test(text) ||
    /\bHeavy Polish/i.test(text) ||
    /\bMind'?s Eye/i.test(text);

  if (spellBypass) tags.push("mechanic:spell-bypass");
  if (
    attackBypass ||
    (!spellBypass &&
      /\bbypass\b/i.test(text) &&
      /(?:weapon|ammo|attacks?|flaming ammo)/i.test(text))
  ) {
    tags.push("mechanic:resistance-bypass");
  }
  if (
    /\bbypass\b.*\bimmunities?\b/i.test(text) ||
    /bypass(?:es)?.*resistances? and immunities/i.test(text) ||
    /immunity and resistance to \w+ damage/i.test(text)
  ) {
    tags.push("mechanic:immunity-bypass");
  }
  return tags;
}

const DUAL_TEMPERATURE_TOLERANCE_RE =
  /\bboth a cool drink and a hot drink\b|\bextreme cold or extreme heat\b/i;

/**
 * Environmental cold/heat tolerance (Hot Drink / Cool Drink armor analogues).
 * Does not match weapon "freezing temperatures" light-shedding wording.
 */
function temperatureToleranceTags(text: string): string[] {
  const isDual = DUAL_TEMPERATURE_TOLERANCE_RE.test(text);

  const hasColdTolerance =
    isDual ||
    /\bsuffer no harm (?:in|from) (?:temperature|temperatures|water) as cold\b/i.test(
      text,
    ) ||
    /\btolerate temperatures as low as\b/i.test(text) ||
    /\bsuffer no ill effects? from being in extremely cold environments?\b/i.test(
      text,
    ) ||
    /\bsuffer no ill effects? from extremely cold environments?\b/i.test(text);

  const hasHeatTolerance =
    isDual ||
    /\bsuffer no harm from temperatures as warm\b/i.test(text) ||
    /\bno harm from temperatures as warm\b/i.test(text);

  if (!hasColdTolerance && !hasHeatTolerance) return [];

  const tags = ["mechanic:temperature-tolerance"];
  if (hasColdTolerance) tags.push("damage:cold");
  if (hasHeatTolerance) tags.push("damage:fire");
  return tags;
}

function onHitTag(text: string): string | null {
  return /when you hit a (?:creature|target) with (?:this weapon|your [\w-]+ ammo)/i.test(
    text,
  )
    ? "mechanic:on-hit"
    : null;
}

function damageRerollTag(text: string): string | null {
  return /reroll the die and must use the new roll, even if the new roll is a 1 or a 2/i.test(
    text,
  )
    ? "mechanic:damage-reroll"
    : null;
}

function grappleOnHitTag(text: string): string | null {
  return /reduce the damage you deal by half to grapple/i.test(text)
    ? "mechanic:grapple-on-hit"
    : null;
}

function positionSwapTag(text: string): string | null {
  return /swap your position with another creature/i.test(text)
    ? "mechanic:position-swap"
    : null;
}

function ammoBuffTag(text: string): string | null {
  return /demon ammo.{0,60}(?:duration and )?effect (?:is|are) doubled/i.test(text)
    ? "mechanic:ammo-buff"
    : null;
}

function cordLengthTag(text: string): string | null {
  return /maximum cord length is increased/i.test(text)
    ? "mechanic:cord-length"
    : null;
}

function hammerChargeTag(text: string): string | null {
  return /hammer's charge only requires you to move \d+ feet/i.test(text)
    ? "mechanic:hammer-charge"
    : null;
}

function reactionShoveTag(text: string): string | null {
  return /reaction to (?:take the |use the )?shove action/i.test(text) &&
    /hits? you with a melee weapon attack/i.test(text)
    ? "mechanic:reaction-shove"
    : null;
}

function bowMeleeModeTag(text: string): string | null {
  return /special melee weapon attack with it/i.test(text) &&
    /\bbow\b/i.test(text)
    ? "mechanic:bow-melee-mode"
    : null;
}

function dodgeAcSaveTag(text: string): string | null {
  return /taking the dodge action/i.test(text) &&
    /Armor Class in place of making the roll/i.test(text)
    ? "mechanic:dodge-ac-save"
    : null;
}

function guardUpTag(text: string): string | null {
  return /use your AC in place of your roll/i.test(text) &&
    /fail(?:ed|s)? a (?:Dexterity|Strength)(?:\s+or\s+(?:Dexterity|Strength))?\s+saving throw/i.test(
      text,
    )
    ? "mechanic:guard-up"
    : null;
}

function hiddenSaveDisadvantageTag(text: string): string | null {
  return /\bdisadvantage on the save\b/i.test(text) &&
    (/\bhidden\b/i.test(text) || /ally is within \d+ feet/i.test(text))
    ? "mechanic:hidden-save-disadvantage"
    : null;
}

const UTILITY_MECHANIC_TAGS = new Set([
  "mechanic:gather-resources",
  "mechanic:hold-breath",
  "mechanic:accelerated-rest",
  "mechanic:spellcasting-focus",
  "mechanic:item-related",
  "mechanic:trap",
  "mechanic:potion-effect",
  "mechanic:temperature-tolerance",
  "mechanic:jump-movement",
  "mechanic:maintenance-free",
  "mechanic:weapon-mode",
  "mechanic:item-transform",
  "mechanic:dragonpiercer",
  "mechanic:crafting-max",
  "mechanic:signal-flare",
  "mechanic:ammo-capacity",
  "mechanic:prehensile-tail",
  "mechanic:gold-double",
  "mechanic:consumable-extend",
  "mechanic:creature-sense",
  "mechanic:creature-proximity",
  "mechanic:carve",
  "mechanic:blindsight",
  "mechanic:truesight",
  "mechanic:tremorsense",
  "mechanic:light-suppression",
  "mechanic:base-ac",
  "mechanic:class-feature",
  "mechanic:cord-length",
  "mechanic:hammer-charge",
  "mechanic:recharge-extended",
  "mechanic:recharge-hourly",
  "mechanic:material-sense",
  "mechanic:hidden-sense",
  "mechanic:web-sense",
  "mechanic:wound-staunch",
  "mechanic:skill-bonus-action",
  "mechanic:conditional-flavor",
  "mechanic:proficiency-improvised",
  "mechanic:breathe-any-environment",
  "mechanic:glide",
  "mechanic:wind-resist",
  "mechanic:condition-suppress",
  "mechanic:proficiency-language",
  "mechanic:proficiency-skill",
  "mechanic:proficiency-tool",
  "mechanic:proficiency-instrument",
  "mechanic:expertise",
  "mechanic:inspiration",
  "mechanic:herb-consumption",
  "mechanic:conjure-item",
  "mechanic:ammo-unlock",
  "mechanic:poison-dc-boost",
  "mechanic:weapon-variant",
  "mechanic:disengage-hide",
  "mechanic:anti-tracking",
  "mechanic:psychoserum-extend",
  "mechanic:grapple-contest",
]);

/** type:utility — hunt/craft/skill/light packages without direct offense or defense. */
function utilityTypeTags(tags: Set<string>): string[] {
  const hasUtilityMechanic =
    [...tags].some(
      (tag) =>
        UTILITY_MECHANIC_TAGS.has(tag) ||
        tag.startsWith("mechanic:skill-") ||
        tag.startsWith("mechanic:gather-") ||
        tag.startsWith("mechanic:fishing") ||
        tag.startsWith("mechanic:mining") ||
        tag.startsWith("mechanic:plant") ||
        tag.startsWith("mechanic:foraging") ||
        tag.startsWith("mechanic:insects") ||
        tag.startsWith("mechanic:bone"),
    ) ||
    (tags.has("mechanic:movement") && !tags.has("type:offensive")) ||
    (tags.has("mechanic:light") && !tags.has("type:offensive")) ||
    (tags.has("mechanic:darkness") &&
      !tags.has("type:offensive") &&
      !tags.has("type:defensive"));

  return hasUtilityMechanic ? ["type:utility"] : [];
}

// ─── Main orchestrator — runs every extractor on one effect string ───────────

function extractTags(
  effectText: string,
  spellLevels?: SpellLevelLookup | null,
): string[] {
  const normalizedText = normalizeEffectApostrophes(effectText);
  const tags = new Set<string>();

  for (const [pattern, tag] of CLASS_PATTERNS) {
    if (pattern.test(normalizedText)) tags.add(tag);
  }
  for (const weaponTag of weaponTypeTags(normalizedText)) {
    tags.add(weaponTag);
  }
  for (const [pattern, tag] of MECHANIC_PATTERNS) {
    if (pattern.test(normalizedText)) tags.add(tag);
  }
  if (matchesFlatDamageReduction(normalizedText)) {
    tags.add("mechanic:damage-reduction");
  }

  const acceleratedRest = acceleratedRestTag(normalizedText);
  if (acceleratedRest) tags.add(acceleratedRest);

  const spellcastingFocus = spellcastingFocusTag(normalizedText);
  if (spellcastingFocus) tags.add(spellcastingFocus);

  const mithral = mithralArmorTag(normalizedText);
  if (mithral) tags.add(mithral);

  // Sub-tags escalados (reemplazan los genéricos)
  const dmg = extraDamageTag(normalizedText);
  if (dmg) tags.add(dmg);

  const heal = healingTag(normalizedText);
  if (heal) tags.add(heal);

  const healOther = healOtherTag(normalizedText);
  if (healOther) tags.add(healOther);

  for (const spell of spellTags(normalizedText, spellLevels)) {
    tags.add(spell);
  }

  const oneUseSpell = oneUseSpellTag(normalizedText, tags);
  if (oneUseSpell) tags.add(oneUseSpell);

  const preparedSpell = preparedSpellTag(normalizedText, tags);
  if (preparedSpell) tags.add(preparedSpell);

  for (const slotTag of spellSlotRecoveryTags(normalizedText)) {
    tags.add(slotTag);
  }

  for (const buffTag of spellBuffTags(normalizedText)) {
    tags.add(buffTag);
  }

  for (const typeTag of typeTags(normalizedText)) {
    tags.add(typeTag);
  }

  for (const damageTag of damageTypeTags(normalizedText)) {
    tags.add(damageTag);
  }

  for (const skillTag of skillTags(normalizedText)) {
    tags.add(skillTag);
  }

  for (const rollTag of rollTargetTags(normalizedText)) {
    tags.add(rollTag);
  }

  for (const initiativeTag of initiativeTags(normalizedText)) {
    tags.add(initiativeTag);
  }

  for (const conditionTag of conditionNameTags(normalizedText)) {
    tags.add(conditionTag);
  }
  if ([...tags].some((tag) => tag.startsWith("mechanic:condition-"))) {
    tags.add("mechanic:condition");
  }

  const cannotBeImmunity = conditionImmunityCannotBeTag(normalizedText);
  if (cannotBeImmunity) tags.add(cannotBeImmunity);

  const againstCondition = againstConditionTag(normalizedText);
  if (againstCondition) tags.add(againstCondition);

  const endDot = endDotTag(normalizedText);
  if (endDot) tags.add(endDot);

  for (const itemTag of itemRelatedTags(normalizedText)) {
    tags.add(itemTag);
  }

  for (const classResourceTag of classResourceTags(normalizedText)) {
    tags.add(classResourceTag);
  }

  for (const gatherTag of gatherResourceTags(normalizedText)) {
    tags.add(gatherTag);
  }

  for (const lightTag of lightDarknessTags(normalizedText)) {
    tags.add(lightTag);
  }

  for (const moveTag of movementTags(normalizedText)) {
    tags.add(moveTag);
  }

  for (const distanceTag of weaponDistanceTags(normalizedText)) {
    tags.add(distanceTag);
  }

  const unarmed = unarmedStrikeTag(normalizedText);
  if (unarmed) tags.add(unarmed);

  const naturalWeapon = naturalWeaponTag(normalizedText);
  if (naturalWeapon) tags.add(naturalWeapon);

  const noDamage = noDamageRiderTag(normalizedText, tags);
  if (noDamage) tags.add(noDamage);

  const potionEffect = potionEffectTag(normalizedText);
  if (potionEffect) tags.add(potionEffect);

  const extendedRecharge = extendedRechargeTag(normalizedText);
  if (extendedRecharge) tags.add(extendedRecharge);

  for (const profTag of proficiencyGrantTags(normalizedText)) {
    tags.add(profTag);
  }

  const inspiration = inspirationTag(normalizedText);
  if (inspiration) tags.add(inspiration);

  const poisonDcBoost = poisonDcBoostTag(normalizedText);
  if (poisonDcBoost) tags.add(poisonDcBoost);

  const saveDcBoost = saveDcBoostTag(normalizedText);
  if (saveDcBoost) tags.add(saveDcBoost);

  const forcedMoveReduction = forcedMovementReductionTag(normalizedText);
  if (forcedMoveReduction) tags.add(forcedMoveReduction);

  const conjureItem = conjureItemTag(normalizedText);
  if (conjureItem) tags.add(conjureItem);

  for (const nmTag of nonmagicalDamageDefenseTags(normalizedText)) {
    tags.add(nmTag);
  }

  const weaponVariant = weaponVariantTag(normalizedText);
  if (weaponVariant) tags.add(weaponVariant);

  const ammoUnlock = ammoUnlockTag(normalizedText);
  if (ammoUnlock) tags.add(ammoUnlock);

  const herbConsumption = herbConsumptionTag(normalizedText);
  if (herbConsumption) tags.add(herbConsumption);

  const consumableShare = consumableShareTag(normalizedText);
  if (consumableShare) tags.add(consumableShare);

  const missTrigger = missTriggerTag(normalizedText);
  if (missTrigger) tags.add(missTrigger);

  const baseAc = baseAcTag(normalizedText);
  if (baseAc) tags.add(baseAc);

  const extraLimbs = extraLimbsTag(normalizedText);
  if (extraLimbs) tags.add(extraLimbs);

  for (const tempTag of temperatureToleranceTags(normalizedText)) {
    tags.add(tempTag);
  }

  for (const mrTag of magicResistanceTags(normalizedText)) {
    tags.add(mrTag);
  }

  const critNeg = critNegationTag(normalizedText);
  if (critNeg) tags.add(critNeg);

  for (const pullTag of forcedMovementTags(normalizedText)) {
    tags.add(pullTag);
  }

  const jumpMove = jumpMovementTag(normalizedText);
  if (jumpMove) tags.add(jumpMove);

  const exhaustMit = exhaustionMitigationTag(normalizedText);
  if (exhaustMit) tags.add(exhaustMit);

  const elemDie = elementalExtraDieTag(normalizedText);
  if (elemDie) tags.add(elemDie);

  const planeShift = planeShiftTag(normalizedText);
  if (planeShift) tags.add(planeShift);

  const flavorCosmetic = flavorCosmeticTag(normalizedText);
  if (flavorCosmetic) tags.add(flavorCosmetic);

  const glide = glideTag(normalizedText);
  if (glide) tags.add(glide);

  const windResist = windResistTag(normalizedText);
  if (windResist) tags.add(windResist);

  const conditionSuppress = conditionSuppressTag(normalizedText);
  if (conditionSuppress) tags.add(conditionSuppress);

  const languageProficiency = languageProficiencyTag(normalizedText);
  if (languageProficiency) tags.add(languageProficiency);

  const disengageHide = disengageHideTag(normalizedText);
  if (disengageHide) tags.add(disengageHide);

  const antiTracking = antiTrackingTag(normalizedText);
  if (antiTracking) tags.add(antiTracking);

  const exhaustionRecovery = exhaustionRecoveryTag(normalizedText);
  if (exhaustionRecovery) tags.add(exhaustionRecovery);

  const invisibilityReaction = invisibilityReactionTag(normalizedText);
  if (invisibilityReaction) tags.add(invisibilityReaction);

  const psychoserumExtend = psychoserumExtendTag(normalizedText);
  if (psychoserumExtend) tags.add(psychoserumExtend);

  const weaponMode = weaponModeSwitchTag(normalizedText);
  if (weaponMode) tags.add(weaponMode);

  const degradingAc = degradingAcTag(normalizedText);
  if (degradingAc) tags.add(degradingAc);

  const conditionalAc = conditionalAcTag(normalizedText);
  if (conditionalAc) tags.add(conditionalAc);

  const itemTransform = itemTransformTag(normalizedText);
  if (itemTransform) tags.add(itemTransform);

  const allyAura = allyAuraTag(normalizedText);
  if (allyAura) tags.add(allyAura);

  const allyThrow = allyThrowTag(normalizedText);
  if (allyThrow) tags.add(allyThrow);

  const powerhouse = powerhouseTag(normalizedText);
  if (powerhouse) tags.add(powerhouse);

  const summon = summonTag(normalizedText);
  if (summon) tags.add(summon);

  const dmgTypeShift = damageTypeShiftTag(normalizedText);
  if (dmgTypeShift) tags.add(dmgTypeShift);

  const dragonpiercer = dragonpiercerTag(normalizedText);
  if (dragonpiercer) tags.add(dragonpiercer);

  const critNoReactions = critNoReactionsTag(normalizedText);
  if (critNoReactions) tags.add(critNoReactions);

  for (const bypassTag of resistanceBypassTags(normalizedText)) {
    tags.add(bypassTag);
  }

  const healingReroll = healingRerollTag(normalizedText);
  if (healingReroll) tags.add(healingReroll);

  const woundCrit = woundCritTag(normalizedText);
  if (woundCrit) tags.add(woundCrit);

  const unarmedUpgrade = unarmedUpgradeTag(normalizedText);
  if (unarmedUpgrade) tags.add(unarmedUpgrade);

  for (const healRedTag of healingReductionTags(normalizedText)) {
    tags.add(healRedTag);
  }

  const craftingMax = craftingMaxTag(normalizedText);
  if (craftingMax) tags.add(craftingMax);

  const goldDouble = goldDoubleTag(normalizedText);
  if (goldDouble) tags.add(goldDouble);

  const abilityScoreSet = abilityScoreSetTag(normalizedText);
  if (abilityScoreSet) tags.add(abilityScoreSet);

  const abilityScoreIncrease = abilityScoreIncreaseTag(normalizedText);
  if (abilityScoreIncrease) tags.add(abilityScoreIncrease);

  const improvisedProficiency = improvisedProficiencyTag(normalizedText);
  if (improvisedProficiency) tags.add(improvisedProficiency);

  const chargeAttack = chargeAttackTag(normalizedText);
  if (chargeAttack) tags.add(chargeAttack);

  const materialSense = materialSenseTag(normalizedText);
  if (materialSense) tags.add(materialSense);

  const breatheAnyEnvironment = breatheAnyEnvironmentTag(normalizedText);
  if (breatheAnyEnvironment) tags.add(breatheAnyEnvironment);

  const classFeatureExtraUse = classFeatureExtraUseTag(normalizedText);
  if (classFeatureExtraUse) tags.add(classFeatureExtraUse);

  const extraAttack = extraAttackTag(normalizedText);
  if (extraAttack) tags.add(extraAttack);

  const creatureSense = creatureSenseTag(normalizedText);
  if (creatureSense) tags.add(creatureSense);

  const hiddenSense = hiddenSenseTag(normalizedText);
  if (hiddenSense) tags.add(hiddenSense);

  const noOpportunityAttacks = noOpportunityAttacksTag(normalizedText);
  if (noOpportunityAttacks) tags.add(noOpportunityAttacks);

  const saveReroll = saveRerollTag(normalizedText);
  if (saveReroll) tags.add(saveReroll);

  const saveFailureMargin = saveFailureMarginTag(normalizedText);
  if (saveFailureMargin) tags.add(saveFailureMargin);

  const skillBonusAction = skillBonusActionTag(normalizedText);
  if (skillBonusAction) tags.add(skillBonusAction);

  const chargeMovement = chargeMovementTag(normalizedText);
  if (chargeMovement) tags.add(chargeMovement);

  const compositeEffect = compositeEffectTag(normalizedText);
  if (compositeEffect) tags.add(compositeEffect);

  const weaponClassMode = weaponClassModeTag(normalizedText);
  if (weaponClassMode) tags.add(weaponClassMode);

  const hpSacrifice = hpSacrificeTag(normalizedText);
  if (hpSacrifice) tags.add(hpSacrifice);

  const woundStaunch = woundStaunchTag(normalizedText);
  if (woundStaunch) tags.add(woundStaunch);

  const conditionalFlavor = conditionalFlavorTag(normalizedText);
  if (conditionalFlavor) tags.add(conditionalFlavor);

  const vulnerability = vulnerabilityTag(normalizedText);
  if (vulnerability) tags.add(vulnerability);

  const consumableExtend = consumableExtendTag(normalizedText);
  if (consumableExtend) tags.add(consumableExtend);

  const signalFlare = signalFlareTag(normalizedText);
  if (signalFlare) tags.add(signalFlare);

  const iceReservoir = iceReservoirTag(normalizedText);
  if (iceReservoir) tags.add(iceReservoir);

  const blightSwap = blightSwapTag(normalizedText);
  if (blightSwap) tags.add(blightSwap);

  const ammoCapacity = ammoCapacityTag(normalizedText);
  if (ammoCapacity) tags.add(ammoCapacity);

  const prehensileTail = prehensileTailTag(normalizedText);
  if (prehensileTail) tags.add(prehensileTail);

  for (const carveTag of carveCheckTags(normalizedText)) {
    tags.add(carveTag);
  }

  const againstDamageSave = againstDamageSaveTag(normalizedText);
  if (againstDamageSave) tags.add(againstDamageSave);

  for (const senseTag of specialSenseTags(normalizedText)) {
    tags.add(senseTag);
  }

  const creatureProximity = creatureProximityTag(normalizedText);
  if (creatureProximity) tags.add(creatureProximity);

  const displacement = displacementTag(normalizedText);
  if (displacement) tags.add(displacement);

  const allyReactionMove = allyReactionMoveTag(normalizedText);
  if (allyReactionMove) tags.add(allyReactionMove);

  const onHit = onHitTag(normalizedText);
  if (onHit) tags.add(onHit);

  const damageReroll = damageRerollTag(normalizedText);
  if (damageReroll) tags.add(damageReroll);

  const grappleOnHit = grappleOnHitTag(normalizedText);
  if (grappleOnHit) tags.add(grappleOnHit);

  const positionSwap = positionSwapTag(normalizedText);
  if (positionSwap) tags.add(positionSwap);

  const ammoBuff = ammoBuffTag(normalizedText);
  if (ammoBuff) tags.add(ammoBuff);

  const cordLength = cordLengthTag(normalizedText);
  if (cordLength) tags.add(cordLength);

  const hammerCharge = hammerChargeTag(normalizedText);
  if (hammerCharge) {
    tags.add(hammerCharge);
    tags.add("mechanic:movement");
  }

  const reactionShove = reactionShoveTag(normalizedText);
  if (reactionShove) tags.add(reactionShove);

  const bowMeleeMode = bowMeleeModeTag(normalizedText);
  if (bowMeleeMode) tags.add(bowMeleeMode);

  const dodgeAcSave = dodgeAcSaveTag(normalizedText);
  if (dodgeAcSave) tags.add(dodgeAcSave);

  const guardUp = guardUpTag(normalizedText);
  if (guardUp) tags.add(guardUp);

  if (usesAcAsSaveReplacement(normalizedText)) {
    tags.delete("mechanic:armor-class");
  }

  const hiddenSaveDisadvantage = hiddenSaveDisadvantageTag(normalizedText);
  if (hiddenSaveDisadvantage) tags.add(hiddenSaveDisadvantage);

  if (/never needs maintenance|cannot rust or tarnish/i.test(normalizedText)) {
    tags.add("mechanic:maintenance-free");
  }

  for (const activationTag of passiveActiveTags(normalizedText, tags)) {
    tags.add(activationTag);
  }

  for (const utilityTag of utilityTypeTags(tags)) {
    tags.add(utilityTag);
  }

  return Array.from(tags);
}

/** Public API — used by `rune.mapper.ts` and unit tests. */
export function extractRuneEffectTags(
  effectText: string,
  spellLevels?: SpellLevelLookup | null,
): string[] {
  return extractTags(effectText, spellLevels);
}
