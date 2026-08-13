import type { CopyRef } from "@/shared/utils/entity-copy.utils";

export type { CopyRef };

export interface BestiaryIndex {
  [sourceCode: string]: string;
}

export interface BestiaryMetaBlock {
  dependencies?: { monster?: string[] };
  otherSources?: { monster?: Record<string, string> };
  internalCopies?: string[];
}

export interface RawMonster {
  name: string;
  source: string;
  page?: number;
  size?: string | string[];
  type?: string | { type: string; tags?: string[] };
  alignment?: string[];
  ac?: unknown;
  hp?: { average?: number; formula?: string };
  speed?: Record<string, number | string>;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  cr?: string | { cr?: string; lair?: string; coven?: string };
  trait?: unknown[];
  action?: unknown[];
  bonus?: unknown[];
  reaction?: unknown[];
  legendary?: unknown[];
  mythic?: unknown[];
  spellcasting?: unknown[];
  legendaryGroup?: { name: string; source: string };
  environment?: string[];
  group?: string[];
  hasFluff?: boolean;
  hasToken?: boolean;
  _copy?: CopyRef;
  [key: string]: unknown;
}

export interface BestiaryFile {
  monster?: RawMonster[];
  _meta?: BestiaryMetaBlock;
}

export interface RawLegendaryGroup {
  name: string;
  source: string;
  lairActions?: unknown[];
  regionalEffects?: unknown[];
  _copy?: CopyRef;
}

export interface LegendaryGroupsFile {
  legendaryGroup?: RawLegendaryGroup[];
  _meta?: BestiaryMetaBlock;
}
