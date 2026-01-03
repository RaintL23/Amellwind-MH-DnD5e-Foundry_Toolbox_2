/**
 * Type definitions for Monster Hunter D&D 5e monsters
 * Based on 5etools JSON schema
 *
 * These types are comprehensive but flexible to handle various monster formats
 */

export interface CRObject {
  cr: string | number;
  lair?: string | number;
  coven?: string | number;
}

export interface Monster {
  name: string;
  source: string;
  page?: number;
  size?: string | string[];
  type?: string | MonsterType;
  alignment?: string | string[];
  ac?: AC[];
  hp?: HP;
  speed?: Speed;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  save?: Record<string, string>;
  skill?: Record<string, string>;
  senses?: string[];
  passive?: number;
  immune?: string[];
  resist?: string[];
  vulnerable?: string[];
  conditionImmune?: string[];
  languages?: string[];
  cr?: string | number | CRObject;
  trait?: Trait[];
  action?: Action[];
  bonus?: Action[];
  reaction?: Action[];
  legendary?: Action[];
  legendaryGroup?: any;
  environment?: string[];
  soundClip?: any;
  traitTags?: string[];
  senseTags?: string[];
  actionTags?: string[];
  languageTags?: string[];
  damageTags?: string[];
  miscTags?: string[];
  conditionInflict?: string[];
  hasToken?: boolean;
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  fluff?: MonsterFluff;
  runes?: Rune[];
  tokenUrl?: string;
}

export interface MonsterType {
  type: string;
  tags?: string[];
}

export interface AC {
  ac?: number;
  from?: string[];
  condition?: string;
  braces?: boolean;
}

export interface HP {
  average?: number;
  formula?: string;
  special?: string;
}

export interface Speed {
  walk?: number | string;
  fly?: number | string;
  swim?: number | string;
  climb?: number | string;
  burrow?: number | string;
  canHover?: boolean;
}

export interface Trait {
  name: string;
  entries: Entry[];
}

export interface Action {
  name: string;
  entries: Entry[];
}

export interface Rune {
  name: string;
  type: string;
  effect: string;
}

export type Entry = string | ComplexEntry;

export interface ComplexEntry {
  type: string;
  name: string;
  items?: Entry[] | ComplexEntry[];
  entries?: Entry[] | ComplexEntry[];
  colStyles?: string;
  rowStyles?: string;
  [key: string]: any;
}

/**
 * Monster Fluff (lore and descriptions)
 */
export interface MonsterFluff {
  name: string;
  source: string;
  entries?: Entry[];
  images?: FluffImage[];
}

export interface FluffImage {
  type: string;
  href: {
    type: string;
    url?: string;
    path?: string;
  };
  title?: string;
  credit?: string;
}

/**
 * Response structure from the Monster Hunter JSON source
 */
export interface MonsterData {
  _meta?: {
    sources?: Array<{
      json: string;
      abbreviation: string;
      full: string;
      authors?: string[];
      convertedBy?: string[];
      version?: string;
      url?: string;
      targetSchema?: string;
    }>;
    dateAdded?: number;
    dateLastModified?: number;
  };
  monster?: Monster[];
  monsterFluff?: MonsterFluff[];
}
