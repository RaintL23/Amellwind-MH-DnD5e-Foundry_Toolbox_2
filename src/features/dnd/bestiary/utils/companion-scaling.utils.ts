/**
 * Detect and apply summoner-scaled companion formulas (PB, class level,
 * spell attack, ability modifiers) used by Beast Master / Drakewarden /
 * Wildfire / summon-spirit style stat blocks.
 */

import type { AbilityKey, ArmorClass, Entry, HP } from "@/shared/types";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import type { StatBlockContent } from "@/shared/types/statblock-content.types";
import { proficiencyBonusAtLevel } from "@/features/dnd/classes/mappers/class-table.mapper";
import {
  formatModifier,
  getAbilityModifier,
} from "@/shared/utils/cr.utils";

export interface CompanionScaleInputs {
  /** Summoner / parent class level (1–20). */
  ownerLevel: number;
  /**
   * Dominant casting / bond ability score (e.g. Warlock Charisma 16).
   * Drives ability modifier and spell attack when those are needed.
   */
  abilityScore?: number | null;
}

/** Typical point-buy / array primary score used as the companion preview default. */
export const DEFAULT_COMPANION_ABILITY_SCORE = 16;

export interface CompanionScaleDetection {
  isScaled: boolean;
  needsOwnerLevel: boolean;
  needsSpellAttack: boolean;
  needsAbilityModifier: boolean;
  /** Class name hinted in HP special text (ranger, druid, …). */
  ownerClassHint?: string;
  /** Ability referenced in prose / AC (charisma, wisdom, …). */
  abilityHint?: AbilityKey;
  /** Display label for the ability input (e.g. "Charisma"). */
  abilityLabel?: string;
}

export interface CompanionDerivedStats {
  proficiencyBonus: number;
  abilityModifier: number | null;
  spellAttackBonus: number | null;
  spellSaveDc: number | null;
}

const WORD_NUMBERS: Record<string, number> = {
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

const ABILITY_NAME_TO_KEY: Record<string, AbilityKey> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
};

const ABILITY_KEY_LABEL: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

/** Typical spellcasting / bond ability by class name hint. */
const CLASS_DEFAULT_ABILITY: Record<string, AbilityKey> = {
  warlock: "cha",
  sorcerer: "cha",
  bard: "cha",
  paladin: "cha",
  wizard: "int",
  artificer: "int",
  cleric: "wis",
  druid: "wis",
  ranger: "wis",
};

function collectCreatureText(creature: BestiaryCreature): string {
  const chunks: string[] = [];
  for (const ac of creature.armorClass) {
    if (ac.special) chunks.push(ac.special);
  }
  if (creature.hp.special) chunks.push(creature.hp.special);
  if (creature.pbNote) chunks.push(creature.pbNote);
  for (const value of Object.values(creature.savingThrows)) {
    if (value) chunks.push(value);
  }
  for (const entry of [
    ...creature.traits,
    ...creature.actions,
    ...(creature.bonusActions ?? []),
    ...creature.reactions,
  ]) {
    chunks.push(entry.name, ...entry.entries);
  }
  return chunks.join("\n");
}

function detectAbilityHint(
  text: string,
  ownerClassHint?: string,
): AbilityKey | undefined {
  const fromProse = text.match(
    /your (strength|dexterity|constitution|intelligence|wisdom|charisma) modifier/i,
  );
  if (fromProse?.[1]) {
    return ABILITY_NAME_TO_KEY[fromProse[1].toLowerCase()];
  }
  if (ownerClassHint && CLASS_DEFAULT_ABILITY[ownerClassHint]) {
    return CLASS_DEFAULT_ABILITY[ownerClassHint];
  }
  return undefined;
}

export function detectCompanionScaling(
  creature: BestiaryCreature,
): CompanionScaleDetection {
  const text = collectCreatureText(creature);
  const hasPbNote = Boolean(creature.pbNote);
  const hasPbFormula =
    /\bPB\b/.test(text) ||
    /proficiency bonus/i.test(text) ||
    /your proficiency/i.test(text);
  const hasLevelFormula =
    /times your \w+ level/i.test(text) || /your \w+ level/i.test(text);
  const needsSpellAttack =
    /hitYourSpellAttack/i.test(text) ||
    /spell attack modifier/i.test(text) ||
    /spell save dc/i.test(text);
  const needsAbilityModifier =
    /your (strength|dexterity|constitution|intelligence|wisdom|charisma) modifier/i.test(
      text,
    );

  const classMatch = text.match(/your (\w+) level/i);
  const ownerClassHintRaw = classMatch?.[1]?.toLowerCase();
  const ownerClassHint =
    ownerClassHintRaw && !["character", "class"].includes(ownerClassHintRaw)
      ? ownerClassHintRaw
      : undefined;

  const abilityHint = detectAbilityHint(text, ownerClassHint);
  const isScaled =
    hasPbNote ||
    hasPbFormula ||
    hasLevelFormula ||
    needsSpellAttack ||
    needsAbilityModifier;

  return {
    isScaled,
    needsOwnerLevel: hasLevelFormula || hasPbNote || hasPbFormula,
    needsSpellAttack,
    needsAbilityModifier,
    ownerClassHint,
    abilityHint,
    abilityLabel: abilityHint ? ABILITY_KEY_LABEL[abilityHint] : undefined,
  };
}

export function resolveCompanionProficiency(
  inputs: Pick<CompanionScaleInputs, "ownerLevel">,
): number {
  const level = Math.min(20, Math.max(1, Math.floor(inputs.ownerLevel) || 1));
  return proficiencyBonusAtLevel(level);
}

export function resolveCompanionAbilityModifier(
  inputs: CompanionScaleInputs,
): number | null {
  if (
    typeof inputs.abilityScore !== "number" ||
    !Number.isFinite(inputs.abilityScore)
  ) {
    return null;
  }
  const score = Math.min(30, Math.max(1, Math.floor(inputs.abilityScore)));
  return getAbilityModifier(score);
}

/**
 * Spell attack = PB + ability modifier (standard 5e).
 * Spell save DC = 8 + PB + ability modifier.
 */
export function deriveCompanionStats(
  inputs: CompanionScaleInputs,
): CompanionDerivedStats {
  const proficiencyBonus = resolveCompanionProficiency(inputs);
  const abilityModifier = resolveCompanionAbilityModifier(inputs);
  if (abilityModifier == null) {
    return {
      proficiencyBonus,
      abilityModifier: null,
      spellAttackBonus: null,
      spellSaveDc: null,
    };
  }
  return {
    proficiencyBonus,
    abilityModifier,
    spellAttackBonus: proficiencyBonus + abilityModifier,
    spellSaveDc: 8 + proficiencyBonus + abilityModifier,
  };
}

/** Parse "14 + PB (natural armor)" → numeric AC when PB is known. */
export function resolveAcSpecial(
  special: string,
  pb: number,
  abilityModifier?: number | null,
): { value: number; label: string } | null {
  const pbMatch = special.match(/^(\d+)\s*\+\s*PB\b(.*)$/i);
  if (pbMatch) {
    const base = Number(pbMatch[1]);
    const rest = (pbMatch[2] ?? "").trim();
    const value = base + pb;
    const label = rest ? `${value} ${rest}` : String(value);
    return { value, label };
  }

  if (typeof abilityModifier === "number" && Number.isFinite(abilityModifier)) {
    const abilityMatch = special.match(
      /^(\d+)\s*(?:\+|plus)\s*your (strength|dexterity|constitution|intelligence|wisdom|charisma) modifier\b(.*)$/i,
    );
    if (abilityMatch) {
      const base = Number(abilityMatch[1]);
      const rest = (abilityMatch[3] ?? "").trim();
      const value = base + abilityModifier;
      const label = rest ? `${value} ${rest}` : String(value);
      return { value, label };
    }
  }

  return null;
}

/**
 * Parse HP specials like:
 * - "5 + five times your ranger level (…)"
 * - "5 + five times your druid level"
 */
export function resolveHpSpecial(
  special: string,
  ownerLevel: number,
): { average: number; label: string } | null {
  const level = Math.min(20, Math.max(1, Math.floor(ownerLevel) || 1));
  const m = special.match(
    /^(\d+)\s*\+\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+times your \w+ level\b(.*)$/i,
  );
  if (!m) return null;
  const base = Number(m[1]);
  const multRaw = (m[2] ?? "").toLowerCase();
  const mult = WORD_NUMBERS[multRaw] ?? Number(multRaw);
  if (!Number.isFinite(mult)) return null;
  const average = base + mult * level;
  const note = (m[3] ?? "").trim();
  const label = note ? `${average} ${note}` : String(average);
  return { average, label };
}

/** Resolve "+1 + PB" / "PB" style save/skill bonuses. */
export function resolvePbBonusExpression(
  expression: string,
  pb: number,
): string {
  const trimmed = expression.trim();
  if (/^PB$/i.test(trimmed)) return formatModifier(pb);

  const plusPb = trimmed.match(/^([+-]?\d+)\s*\+\s*PB$/i);
  if (plusPb) {
    return formatModifier(Number(plusPb[1]) + pb);
  }

  const pbPlus = trimmed.match(/^PB\s*\+\s*([+-]?\d+)$/i);
  if (pbPlus) {
    return formatModifier(pb + Number(pbPlus[1]));
  }

  return trimmed.replace(/\bPB\b/g, String(pb));
}

function scalePlainText(
  text: string,
  derived: CompanionDerivedStats,
): string {
  let result = text;
  const { proficiencyBonus: pb, abilityModifier, spellAttackBonus, spellSaveDc } =
    derived;

  if (typeof spellAttackBonus === "number") {
    result = result.replace(
      /\{@hitYourSpellAttack\}/gi,
      `{@hit ${spellAttackBonus}}`,
    );
    result = result.replace(
      /\byour spell attack modifier\b/gi,
      formatModifier(spellAttackBonus),
    );
  } else {
    result = result.replace(
      /\{@hitYourSpellAttack\}/gi,
      "your spell attack modifier",
    );
  }

  if (typeof spellSaveDc === "number") {
    result = result.replace(/\byour spell save DC\b/gi, `DC ${spellSaveDc}`);
  }

  if (typeof abilityModifier === "number") {
    result = result.replace(
      /\byour (strength|dexterity|constitution|intelligence|wisdom|charisma) modifier\b/gi,
      formatModifier(abilityModifier),
    );
  }

  result = result.replace(/\byour proficiency bonus\b/gi, formatModifier(pb));
  result = result.replace(/\byour Proficiency\b/g, formatModifier(pb));
  result = result.replace(/\bplus PB\b/g, `plus ${pb}`);
  result = result.replace(/\+\s*PB\b/g, `+ ${pb}`);
  result = result.replace(/\bPB\b/g, String(pb));

  return result;
}

function scaleStatBlockContent(
  content: StatBlockContent[],
  derived: CompanionDerivedStats,
): StatBlockContent[] {
  return content.map((block) => {
    switch (block.type) {
      case "paragraph":
        return {
          ...block,
          text: scalePlainText(block.text, derived),
        };
      case "section":
        return {
          ...block,
          name: scalePlainText(block.name, derived),
          children: scaleStatBlockContent(block.children, derived),
        };
      case "list":
        return {
          ...block,
          items: block.items.map((item) =>
            item.type === "text"
              ? { ...item, text: scalePlainText(item.text, derived) }
              : {
                  ...item,
                  name: scalePlainText(item.name, derived),
                  children: scaleStatBlockContent(item.children, derived),
                },
          ),
        };
      case "table":
        return block;
      default:
        return block;
    }
  });
}

function scaleEntries(
  entries: Entry[],
  derived: CompanionDerivedStats,
): Entry[] {
  return entries.map((entry) => ({
    ...entry,
    entries: entry.entries.map((line) => scalePlainText(line, derived)),
    content: entry.content
      ? scaleStatBlockContent(entry.content, derived)
      : undefined,
  }));
}

function scaleArmorClass(
  armorClass: ArmorClass[],
  derived: CompanionDerivedStats,
): ArmorClass[] {
  return armorClass.map((ac) => {
    if (!ac.special) return ac;
    const resolved = resolveAcSpecial(
      ac.special,
      derived.proficiencyBonus,
      derived.abilityModifier,
    );
    if (!resolved) return ac;
    return {
      ac: resolved.value,
      from: ac.from,
      special: undefined,
    };
  });
}

function scaleHp(hp: HP, ownerLevel: number): HP {
  if (!hp.special) return hp;
  const resolved = resolveHpSpecial(hp.special, ownerLevel);
  if (!resolved) return hp;
  return {
    average: resolved.average,
    formula: hp.special,
    special: undefined,
  };
}

/** Returns a display copy of the creature with summoner scaling applied. */
export function applyCompanionScaling(
  creature: BestiaryCreature,
  inputs: CompanionScaleInputs,
): BestiaryCreature {
  const derived = deriveCompanionStats(inputs);
  const level = Math.min(20, Math.max(1, Math.floor(inputs.ownerLevel) || 1));

  const savingThrows: Partial<Record<AbilityKey, string>> = {};
  for (const [key, value] of Object.entries(creature.savingThrows)) {
    if (value == null) continue;
    savingThrows[key as AbilityKey] = resolvePbBonusExpression(
      value,
      derived.proficiencyBonus,
    );
  }

  return {
    ...creature,
    proficiencyBonus: derived.proficiencyBonus,
    armorClass: scaleArmorClass(creature.armorClass, derived),
    hp: scaleHp(creature.hp, level),
    savingThrows,
    traits: scaleEntries(creature.traits, derived),
    actions: scaleEntries(creature.actions, derived),
    reactions: scaleEntries(creature.reactions, derived),
    bonusActions: creature.bonusActions
      ? scaleEntries(creature.bonusActions, derived)
      : undefined,
  };
}
