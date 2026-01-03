/**
 * Type definitions for Runes
 * Runes are material effects that can be applied to armor and weapons
 */

export interface Rune {
  name: string;
  type: string; // "armor", "weapon", "other"
  effect: string;
  monsterName?: string; // Added to track which monster the rune comes from
  monsterSource?: string;
}

export interface RuneWithMonster extends Rune {
  monsterName: string;
  monsterSource: string;
  tier: number; // 0-4, based on monster CR
  intent?: string[]; // Intencionalidad: "critical", "elemental", "weapon-damage", "spell-charges", etc.
  weapons?: string[]; // Specific weapons: "longsword", "bow", "switch axe", etc.
  classes?: string[]; // Specific classes: "bard", "fighter", "cleric", etc.
}

export type RuneType = "armor" | "weapon" | "other" | "all";

export type RuneTier = 0 | 1 | 2 | 3 | 4;

export interface RuneFilters {
  search: string;
  type: RuneType;
  tier?: RuneTier;
  intent?: string;
  weapon?: string;
  class?: string;
}
