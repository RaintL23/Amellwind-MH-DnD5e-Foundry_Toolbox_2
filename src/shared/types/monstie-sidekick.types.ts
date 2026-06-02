import type { DowntimeTable } from "./downtime.types";
import type { SkillKey } from "./actor.types";
import type { Monster } from "./monster.types";

export type MonstieRulesContent =
  | { type: "paragraph"; text: string }
  | { type: "table"; table: DowntimeTable }
  | { type: "section"; name: string; children: MonstieRulesContent[] }
  | { type: "statblock"; monster: Monster };

export interface MonstieLevelProgression {
  level: number;
  features: string[];
}

export interface MonstieSidekickClass {
  name: string;
  source: string;
  page?: number;
  isSidekick: boolean;
  progression: MonstieLevelProgression[];
}

export interface MonstieSidekickGuide {
  rules: MonstieRulesContent[];
  sidekickClass: MonstieSidekickClass | null;
  classFeatures: MonstieClassFeature[];
}

export interface MonstieClassFeature {
  name: string;
  level: number;
  page?: number;
  entries: string[];
}

export interface MonstieDraft {
  customName: string;
  level: number;
  baseMonsterName: string;
  /** Skill keys chosen from the base monster (max depends on level) */
  selectedSkills: SkillKey[];
  signatureAttackName: string;
  /** Trait names learned at L2 / L10 / L20 */
  selectedTraits: string[];
  /** Trait or action names from Creature feature (L3 / L11 / L18) */
  selectedCreatureFeatures: string[];
}

export interface MonstieSidekick extends Monster {
  level: number;
  baseMonsterName: string;
  classFeatures: MonstieClassFeature[];
}

export interface MonstieBuildMeta {
  proficiencyBonus: number;
  saveDcFormula: string;
  hpFormula: string;
  speedNote: string;
  sensesNote: string;
}

