import type { Actor, Entry } from "./actor.types";
import type {
  SpellcastingSpellLine,
  StatBlockContent,
} from "./statblock-content.types";

export interface LegendaryGroupRef {
  name: string;
  source: string;
}

export interface LegendaryGroup {
  name: string;
  source: string;
  lairActions: StatBlockContent[];
  regionalEffects: StatBlockContent[];
}

export interface SpellcastingBlock {
  name: string;
  displayAs?: string;
  header: StatBlockContent[];
  spellLines: SpellcastingSpellLine[];
  footer: StatBlockContent[];
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
  hasFluff?: boolean;
  variantCount?: number;
  variantSources?: string[];
  searchText?: string;
}
