import type { Actor, Entry } from "./actor.types";

export interface LegendaryGroupRef {
  name: string;
  source: string;
}

export interface LegendaryGroup {
  name: string;
  source: string;
  lairActions: string[];
  regionalEffects: string[];
}

export interface SpellcastingBlock {
  name: string;
  header: string[];
  footer: string[];
}

export interface BestiaryCreature extends Actor {
  id: string;
  source: string;
  page?: number;
  cr: string;
  crDisplay: string;
  environment?: string[];
  group?: string[];
  legendaryActions?: Entry[];
  bonusActions?: Entry[];
  mythicActions?: Entry[];
  spellcasting?: SpellcastingBlock[];
  legendaryGroupRef?: LegendaryGroupRef;
  legendaryGroup?: LegendaryGroup;
  hasToken?: boolean;
  variantCount?: number;
  variantSources?: string[];
  searchText?: string;
}
