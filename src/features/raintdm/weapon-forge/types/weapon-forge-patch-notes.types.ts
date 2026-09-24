/** Types for public/data/raintdm-weapons/patch-notes/*.json */

export type WeaponForgePatchChangeKind =
  | "weapon-added"
  | "weapon-removed"
  | "field"
  | "feature-added"
  | "feature-removed"
  | "feature-renamed"
  | "feature-text"
  | "dice"
  | "rarity-table";

export interface WeaponForgePatchChange {
  kind: WeaponForgePatchChangeKind;
  text: string;
  feature?: string;
  before?: string;
  after?: string;
}

export interface WeaponForgePatchWeapon {
  name: string;
  file: string;
  changes: WeaponForgePatchChange[];
}

export interface WeaponForgePatchNoteEntry {
  summary: string;
  commit: string;
  weapons: WeaponForgePatchWeapon[];
}

export interface WeaponForgePatchNotesDay {
  date: string;
  generatedAt?: string;
  entries: WeaponForgePatchNoteEntry[];
}

export interface WeaponForgePatchNotesIndex {
  version: number;
  generatedAt: string;
  description?: string;
  dates: string[];
}
