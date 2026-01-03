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
}

export type RuneType = "armor" | "weapon" | "other" | "all";

export interface RuneFilters {
  search: string;
  type: RuneType;
}
