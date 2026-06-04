import type { AbilityKey, SkillKey } from "./actor.types";
import type { Monster } from "./monster.types";

export type NpcTemplateCategory =
  | "strength-combatant"
  | "dexterity-combatant"
  | "non-combatant"
  | "caster"
  | "support";

export const NPC_TEMPLATE_CATEGORY_LABELS: Record<NpcTemplateCategory, string> = {
  "strength-combatant": "Strength Combatant",
  "dexterity-combatant": "Dexterity Combatant",
  "non-combatant": "Non Combatant",
  caster: "Caster",
  support: "Support",
};

export type NpcGender = "male" | "female" | "other" | "random";

export type NpcAttributeArray = "standard" | "heroic" | "random";

/** What to hide in the stat block traits section. `all` = show everything. */
export type NpcHideFeatures = "all" | "racial" | "template" | "background";

export type NpcHitDie = 4 | 6 | 8 | 10 | 12 | 20;

export interface NpcTemplateTrait {
  name: string;
  entries: string[];
}

export interface NpcAttackDefinition {
  name: string;
  kind: "mw" | "rw";
  ability: AbilityKey;
  reachOrRange: string;
  damageDice: string;
  /** Flat damage bonus added after ability modifier. */
  flatDamageBonus?: number;
  damageType: string;
  /** AGMH hunter weapon to derive stats and optional features from. */
  mhWeaponName?: string;
}

export interface NpcTemplate {
  id: string;
  name: string;
  category: NpcTemplateCategory;
  description: string;
  srdReference: string;
  abilityPriority: AbilityKey[];
  primaryAbility: AbilityKey;
  saveProficiencies: AbilityKey[];
  skillProficiencies: SkillKey[];
  traits: NpcTemplateTrait[];
  attacks: NpcAttackDefinition[];
  reactions?: NpcTemplateTrait[];
  defaultAc: number | "unarmored-dex" | "unarmored-dex-max2";
  defaultAcFrom: string;
  /** Hit dice count at which multiattack is added. */
  multiattackAt: number;
  /** Power tier 0–3 (UI: Tier 1–4). Sets CR bands and MH gear scaling. */
  tier: number;
}

export interface NpcDraft {
  customName: string;
  gender: NpcGender;
  templateId: string;
  speciesId: string;
  backgroundId: string;
  attributeArray: NpcAttributeArray;
  hitDiceCount: number;
  hitDie: NpcHitDie;
  hideFeatures: NpcHideFeatures;
}

export interface GeneratedNpc extends Monster {
  descriptor: string;
}

export const HIT_DIE_OPTIONS: Array<{ die: NpcHitDie; label: string }> = [
  { die: 4, label: "d4 (Tiny Creature)" },
  { die: 6, label: "d6 (Small Creature)" },
  { die: 8, label: "d8 (Medium Creature)" },
  { die: 10, label: "d10 (Large Creature)" },
  { die: 12, label: "d12 (Huge Creature)" },
  { die: 20, label: "d20 (Gargantuan Creature)" },
];

export const NPC_GENDER_LABELS: Record<Exclude<NpcGender, "random">, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const NPC_HIDE_FEATURES_LABELS: Record<NpcHideFeatures, string> = {
  all: "Show All Features",
  racial: "Hide Racial Features",
  template: "Hide Template Features",
  background: "Hide Background Features",
};

export const NPC_ATTRIBUTE_ARRAY_LABELS: Record<NpcAttributeArray, string> = {
  standard: "Standard (15, 14, 13, 12, 10, 8)",
  heroic: "Heroic (4d6 drop lowest, reroll 1s)",
  random: "Random (4d6 drop lowest)",
};
