/**
 * Minimal TypeScript shapes for the Foundry VTT v12 / dnd5e 4.x documents the
 * exporter produces. These are intentionally permissive (Record fallbacks) so
 * the builder can emit system blocks that match the example actors in
 * `backup_jsons/Player_Character_Example` without modelling every optional key.
 */

export interface FoundryStats {
  compendiumSource: string | null;
  duplicateSource: string | null;
  coreVersion: string;
  systemId: string;
  systemVersion: string;
  createdTime: number | null;
  modifiedTime: number | null;
  lastModifiedBy: string | null;
}

export interface FoundryEffectChange {
  key: string;
  /** ADD=2, MULTIPLY=1, OVERRIDE=5, UPGRADE=4, DOWNGRADE=3, CUSTOM=0. */
  mode: number;
  value: string;
  priority: number;
}

export interface FoundryActiveEffect {
  _id: string;
  name: string;
  img: string;
  description: string;
  changes: FoundryEffectChange[];
  disabled: boolean;
  duration: Record<string, unknown>;
  origin: string | null;
  transfer: boolean;
  statuses: string[];
  type: "base";
  system: Record<string, unknown>;
  tint: string;
  sort: number;
  flags: Record<string, unknown>;
  _stats: FoundryStats;
}

export interface FoundryItem {
  _id: string;
  name: string;
  type: string;
  img: string;
  system: Record<string, unknown>;
  effects: FoundryActiveEffect[];
  folder: null;
  sort: number;
  ownership: Record<string, number>;
  flags: Record<string, unknown>;
  _stats: FoundryStats;
}

export interface FoundryActor {
  name: string;
  type: "character";
  img: string;
  system: Record<string, unknown>;
  items: FoundryItem[];
  effects: FoundryActiveEffect[];
  prototypeToken: Record<string, unknown>;
  folder: null;
  sort: number;
  ownership: Record<string, number>;
  flags: Record<string, unknown>;
  _stats: FoundryStats;
}
