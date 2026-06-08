import {
  Actor,
  AbilityScores,
  AbilityKey,
  SkillKey,
  HP,
  Speed,
  ArmorClass,
  Senses,
  Skills,
  DamageEntry,
  Entry,
} from "@/shared/types";
import { SKILL_ABILITY } from "../utils/check-modifiers.utils";

// ─── Proficiency Bonus by Level ──────────────────────────────────────────────

const PROFICIENCY_TABLE: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6,
};

// ─── Classic Human 2024 Defaults ─────────────────────────────────────────────

const DEFAULT_ABILITIES: AbilityScores = {
  str: 11,
  dex: 11,
  con: 11,
  int: 11,
  wis: 11,
  cha: 11,
};

// ─── Character Class ─────────────────────────────────────────────────────────

export class Character implements Actor {
  // Identity
  name: string;
  shortName?: string;
  size: string;
  type: { type: string; tags?: string[] };
  alignment: string[];

  // Combat
  armorClass: ArmorClass[];
  hp: HP;
  speed: Speed;
  initiative: number;
  proficiencyBonus: number;

  // Abilities
  abilities: AbilityScores;
  savingThrows: Partial<Record<AbilityKey, string>>;
  skills: Skills;
  passivePerception: number;

  // Senses & Defenses
  senses: Senses;
  damageImmunities: DamageEntry[];
  damageResistances: DamageEntry[];
  damageVulnerabilities: DamageEntry[];
  conditionImmunities: string[];
  languages: string[];

  // Features
  traits: Entry[];
  actions: Entry[];
  reactions: Entry[];

  // Builder-specific
  private _level: number;

  constructor(level: number = 1, abilities?: Partial<AbilityScores>) {
    this._level = Math.max(1, Math.min(20, level));

    // Merge provided abilities over Human Classic 2024 defaults
    this.abilities = { ...DEFAULT_ABILITIES, ...abilities };

    // Identity defaults (Classic Human)
    this.name = "Hunter";
    this.size = "M";
    this.type = { type: "humanoid", tags: ["human"] };
    this.alignment = ["N"];

    // Derived stats
    this.proficiencyBonus = PROFICIENCY_TABLE[this._level];
    this.initiative = this.getModifier("dex");

    // HP: d10 hit die (fighter-like for testing)
    const conMod = this.getModifier("con");
    const hpAvg = 10 + conMod + (this._level - 1) * (6 + conMod);
    this.hp = { average: hpAvg, current: hpAvg };

    // AC: default 10 + DEX (unarmored)
    this.armorClass = [{ ac: 10 + this.getModifier("dex") }];

    // Speed
    this.speed = { walk: 30 };

    // Saving throws (none proficient by default)
    this.savingThrows = {};

    // Skills (none proficient by default)
    this.skills = {};

    // Perception
    this.passivePerception = 10 + this.getModifier("wis");

    // Senses & Defenses (empty for human)
    this.senses = {};
    this.damageImmunities = [];
    this.damageResistances = [];
    this.damageVulnerabilities = [];
    this.conditionImmunities = [];
    this.languages = ["Common"];

    // Features (empty placeholder)
    this.traits = [];
    this.actions = [];
    this.reactions = [];
  }

  // ─── Getters ─────────────────────────────────────────────────────────────

  get level(): number {
    return this._level;
  }

  // ─── Methods ─────────────────────────────────────────────────────────────

  getModifier(ability: AbilityKey): number {
    return Math.floor((this.abilities[ability] - 10) / 2);
  }

  getAttackBonus(ability: AbilityKey): number {
    return this.getModifier(ability) + this.proficiencyBonus;
  }

  getProficiencyBonus(): number {
    return this.proficiencyBonus;
  }

  isSavingThrowProficient(ability: AbilityKey): boolean {
    return this.savingThrows[ability] !== undefined;
  }

  getSavingThrowModifier(ability: AbilityKey): number {
    const base = this.getModifier(ability);
    return this.isSavingThrowProficient(ability)
      ? base + this.proficiencyBonus
      : base;
  }

  getSkillProficiencyLevel(skill: SkillKey): 0 | 1 | 2 {
    return this.skills[skill] ?? 0;
  }

  getSkillModifier(skill: SkillKey): number {
    const ability = SKILL_ABILITY[skill];
    const level = this.getSkillProficiencyLevel(skill);
    return this.getModifier(ability) + level * this.proficiencyBonus;
  }

  getPassiveScore(skill: SkillKey): number {
    return 10 + this.getSkillModifier(skill);
  }

  getAttacksPerTurn(): number {
    // Extra Attack at level 5 (standard martial)
    return this._level >= 5 ? 2 : 1;
  }

  /**
   * Determines which ability to use for attack/damage based on weapon properties.
   * Finesse weapons use the higher of STR or DEX.
   */
  getAttackAbility(weaponProperties: string[]): AbilityKey {
    const isFinesse = weaponProperties.includes("F");
    const isRanged = weaponProperties.includes("A");

    if (isRanged) return "dex";
    if (isFinesse) {
      return this.getModifier("dex") >= this.getModifier("str") ? "dex" : "str";
    }
    return "str";
  }

  /**
   * Returns a new Character instance with updated level and abilities.
   * Immutable pattern for React state.
   */
  withUpdates(updates: { level?: number; abilities?: Partial<AbilityScores> }): Character {
    const newLevel = updates.level ?? this._level;
    const newAbilities = updates.abilities
      ? { ...this.abilities, ...updates.abilities }
      : this.abilities;

    return new Character(newLevel, newAbilities);
  }
}
